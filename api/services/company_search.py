"""Build the database search plan for the company list.

Search pipeline (keep this list in sync when adding a search preference):

1. Trim the input and remove punctuation from name tokens. PostgreSQL's ``simple``
   text-search configuration then handles case folding and token order.
2. Treat a 10/12 digit value as an identity in "all"/"org_nr" mode. It is sent
   only to indexed identifier lookups; a personal number must never trigger a
   multi-million-row name scan.
3. Match name tokens as unordered prefixes. This lets "Anna Bergström" match
   "Bergström, Anna" and lets words occur between query terms.
4. If the exact result set is empty, retry with trigram candidates for minor
   spelling differences. Common legal-form words are ignored only in this
   fuzzy fallback.
5. Rank full-name and exact-token matches above prefix matches. Within each
   match quality, prefer the displayed company name, then the directly stored
   registered name, and finally Bolagsverket aliases.
6. Queries with one token of 1-3 characters use a bounded B-tree prefix plan.
   A single character searches displayed names only; two or three characters
   also inspect registered names and aliases. They use the same paginated
   result contract as longer searches, including a separate exact total.
7. Deduplicate company IDs and keep the best-ranked source plus its matched
   name. The caller exposes that name only when an alias produced the match,
   then applies pagination and stable secondary sorting.
8. When filters are active, expose them as a non-materialized company scope.
   PostgreSQL may then start with either the most selective text index or the
   most selective filter index. A global candidate limit must never hide a
   match inside a segment.

Performance assumptions and optimizations:

* Multi-token searches use the combined GIN index from
  ``250_company_combined_name_search.sql``. Single tokens of at least four
  characters use trigram-backed substring matching so inputs such as ``linde``
  are cheap inside both global and segmented result sets. The same trigram
  indexes supply typo-tolerant fallback candidates.
* One- to three-character queries are allowed as normal result searches. A
  single short token uses the existing lower-case B-tree prefix indexes, not
  ``ILIKE '%x%'``.
* Fuzzy matching starts at four characters and normally prefilters by each
  word's first three letters. For Swedish a/å/ä and o/ö ambiguity in the second
  letter, only the first letter is required. Without that guard, trigram
  searches are too broad on millions of companies. There
  is no minimum query length: shorter input still gets exact prefix matching.
* Numeric identities and names deliberately use separate plans. This is both
  faster and avoids interpreting a personal number as company-name text.
* Data pages start with canonical/registered names. Historical aliases are
  expanded only when those higher-ranked sources cannot fill the requested
  page. Exact totals still include aliases. This preserves result order while
  avoiding thousands of random current-state lookups for common words.
* Filter scopes use ``AS NOT MATERIALIZED`` deliberately. Forcing an
  intermediate list of IDs made the database read the large history heap twice
  and prevented its planner from choosing the cheapest join order.
* Fuzzy result candidates are bounded per name source, while the separate count
  plan stays unbounded. Each fuzzy token must match a word with the same prefix;
  another word in the company name cannot satisfy that guard accidentally.
"""

from __future__ import annotations

import re
from dataclasses import dataclass


FUZZY_WORD_THRESHOLD = 0.55
MIN_FUZZY_TOKEN_LENGTH = 4
DISPLAY_NAME_PRIORITY = 3000
REGISTERED_NAME_PRIORITY = 2000
ALIAS_PRIORITY = 1000
FUZZY_IGNORED_TOKENS = frozenset(
    {
        "ab",
        "aktiebolag",
        "ek",
        "ekonomisk",
        "enskild",
        "firma",
        "forening",
        "förening",
        "hb",
        "handelsbolag",
        "kb",
        "kommanditbolag",
    }
)

_NAME_TOKEN_RE = re.compile(r"[^\W_]+", re.UNICODE)


@dataclass(frozen=True)
class CompanySearchPlan:
    """SQL candidate set plus bound parameters for one search request."""

    matches_sql: str
    params: dict[str, object]
    expanded_matches_sql: str | None = None
    count_matches_sql: str | None = None
    fuzzy_matches_sql: str | None = None
    fuzzy_count_matches_sql: str | None = None
    uses_fuzzy_matching: bool = False
    autocomplete: bool = False

    def expanded(self) -> CompanySearchPlan | None:
        if not self.expanded_matches_sql:
            return None
        return CompanySearchPlan(
            matches_sql=self.expanded_matches_sql,
            params=self.params,
            count_matches_sql=self.count_matches_sql,
            fuzzy_matches_sql=self.fuzzy_matches_sql,
            fuzzy_count_matches_sql=self.fuzzy_count_matches_sql,
            uses_fuzzy_matching=self.uses_fuzzy_matching,
            autocomplete=self.autocomplete,
        )

    def fuzzy_fallback(self) -> CompanySearchPlan | None:
        if not self.fuzzy_matches_sql:
            return None
        return CompanySearchPlan(
            matches_sql=self.fuzzy_matches_sql,
            count_matches_sql=(
                self.fuzzy_count_matches_sql or self.fuzzy_matches_sql
            ),
            params=self.params,
            uses_fuzzy_matching=True,
            autocomplete=self.autocomplete,
        )


def _identity_digits(query: str) -> str | None:
    digits = re.sub(r"\D", "", query)
    return digits if len(digits) in (10, 12) else None


def _name_tokens(query: str) -> list[str]:
    # dict preserves input order while removing duplicate tokens.
    return list(dict.fromkeys(_NAME_TOKEN_RE.findall(query.casefold())))


def _identity_plan(
    digits: str, *, restrict_to_filtered: bool = False
) -> CompanySearchPlan:
    params: dict[str, object] = {"search_identity": digits}
    current_company_source = (
        "filtered_companies" if restrict_to_filtered else "core.company_current"
    )
    selects = [
        f"""
        SELECT identifier.company_id, 10000::real AS search_rank,
               NULL::text AS matched_name,
               'identity'::text AS match_source,
               10000::smallint AS source_priority
        FROM core.company_identifier identifier
        JOIN {current_company_source} identity_current
          ON identity_current.company_id = identifier.company_id
        WHERE identifier.identity_type IN ('ORGNR', 'PERSON_SHORT')
          AND identifier.identity_value = %(search_identity)s
        """
    ]

    if len(digits) == 10:
        selects.append(
            f"""
            SELECT identifier.company_id, 10000::real AS search_rank,
                   NULL::text AS matched_name,
                   'identity'::text AS match_source,
                   10000::smallint AS source_priority
            FROM core.company_identifier identifier
            JOIN {current_company_source} identity_current
              ON identity_current.company_id = identifier.company_id
            WHERE identifier.identity_type = 'PERSON'
              AND right(identifier.identity_value, 10) = %(search_identity)s
            """
        )
    else:
        selects.append(
            f"""
            SELECT identifier.company_id, 10000::real AS search_rank,
                   NULL::text AS matched_name,
                   'identity'::text AS match_source,
                   10000::smallint AS source_priority
            FROM core.company_identifier identifier
            JOIN {current_company_source} identity_current
              ON identity_current.company_id = identifier.company_id
            WHERE identifier.identity_type = 'PERSON'
              AND identifier.identity_value = %(search_identity)s
            """
        )
        if digits.startswith("16"):
            params["search_org_identity"] = digits[-10:]
            selects.append(
                f"""
                SELECT identifier.company_id, 10000::real AS search_rank,
                       NULL::text AS matched_name,
                       'identity'::text AS match_source,
                       10000::smallint AS source_priority
                FROM core.company_identifier identifier
                JOIN {current_company_source} identity_current
                  ON identity_current.company_id = identifier.company_id
                WHERE identifier.identity_type = 'ORGNR'
                  AND identifier.identity_value = %(search_org_identity)s
                """
            )

    return CompanySearchPlan(
        matches_sql=_deduplicate(" UNION ALL ".join(selects)),
        params=params,
    )


def _empty_plan() -> CompanySearchPlan:
    return CompanySearchPlan(
        matches_sql=(
            "SELECT NULL::bigint AS company_id, NULL::real AS search_rank, "
            "NULL::text AS matched_name, NULL::text AS match_source, "
            "NULL::smallint AS source_priority WHERE false"
        ),
        params={},
    )


def _deduplicate(candidate_sql: str) -> str:
    return f"""
        SELECT DISTINCT ON (company_id)
               company_id, search_rank, matched_name, match_source
        FROM ({candidate_sql}) AS search_candidates
        ORDER BY company_id, search_rank DESC, source_priority DESC,
                 lower(matched_name) NULLS LAST
    """


def _deduplicate_count(candidate_sql: str) -> str:
    return f"""
        SELECT DISTINCT company_id
        FROM ({candidate_sql}) AS search_count_candidates
    """


def _count_candidates(candidates: list[str]) -> str:
    if len(candidates) == 1:
        return candidates[0]
    return _deduplicate_count(" UNION ALL ".join(candidates))


def _field_count_candidate(
    *, from_sql: str, company_id_sql: str, condition: str
) -> str:
    return f"""
        SELECT {company_id_sql} AS company_id
        FROM {from_sql}
        WHERE {condition}
    """


def _field_candidate(
    *,
    from_sql: str,
    company_id_sql: str,
    field_sql: str,
    condition: str,
    source_priority: int,
    match_source: str,
    rank_sql: str | None = None,
    tail_sql: str = "",
) -> str:
    normalized_field_sql = (
        "btrim(regexp_replace(lower(coalesce("
        f"{field_sql}, '')), '[^[:alnum:]åäö]+', ' ', 'g'))"
    )
    exact_rank_sql = f"""
        (CASE
          WHEN {normalized_field_sql} = %(search_normalized_name)s THEN 900
          WHEN to_tsvector('simple', coalesce({field_sql}, ''))
               @@ plainto_tsquery('simple', %(search_plain_query)s) THEN 600
          ELSE 0
        END)
        + (CASE WHEN lower({field_sql}) LIKE %(search_first_prefix)s
                THEN 20 ELSE 0 END)
    """
    effective_rank_sql = rank_sql or (
        f"{source_priority} + ({exact_rank_sql})"
    )
    select_sql = f"""
        SELECT {company_id_sql} AS company_id,
               ({effective_rank_sql})::real AS search_rank,
               {field_sql} AS matched_name,
               '{match_source}'::text AS match_source,
               {source_priority}::smallint AS source_priority
        FROM {from_sql}
        WHERE {condition}
        {tail_sql}
    """
    return f"({select_sql})" if tail_sql else select_sql


def _name_plan(
    query: str,
    *,
    candidate_limit: int,
    restrict_to_filtered: bool = False,
) -> CompanySearchPlan:
    tokens = _name_tokens(query)
    if not tokens:
        return _empty_plan()

    params: dict[str, object] = {
        "search_tsquery": " & ".join(f"{token}:*" for token in tokens),
        "search_first_prefix": f"{tokens[0]}%",
        "search_plain_query": " ".join(tokens),
        "search_normalized_name": " ".join(tokens),
        "search_candidate_limit": candidate_limit,
    }
    short_prefix_search = len(tokens) == 1 and len(tokens[0]) <= 3
    contains_search = len(tokens) == 1 and len(tokens[0]) >= 4
    displayed_name_only = short_prefix_search and len(tokens[0]) == 1
    if short_prefix_search:
        params["search_short_prefix"] = f"{tokens[0]}%"
        # Each indexed source only needs enough candidates for the requested
        # result window. The unbounded count plan remains separate.
    if contains_search:
        params["search_contains"] = f"%{tokens[0]}%"
    fuzzy_tokens = [
        token
        for token in tokens
        if len(token) >= MIN_FUZZY_TOKEN_LENGTH
        and token not in FUZZY_IGNORED_TOKENS
    ]
    for index, token in enumerate(fuzzy_tokens):
        params[f"search_fuzzy_{index}"] = token

    if fuzzy_tokens:
        fuzzy_prefixes = [
            token[:1] if token[1] in "aåäoö" else token[:3]
            for token in fuzzy_tokens
        ]
        for index, prefix in enumerate(fuzzy_prefixes):
            params[f"search_fuzzy_prefix_{index}"] = f"{prefix}%"
        fuzzy_prefixes.extend(
            token for token in tokens if token not in fuzzy_tokens
        )
        initials = list(dict.fromkeys(fuzzy_prefixes))
        params["search_fuzzy_initial_tsquery"] = " & ".join(
            f"{initial}:*" for initial in initials
        )

    def conditions(field: str) -> tuple[str, str | None]:
        exact = (
            f"lower({field}) LIKE %(search_short_prefix)s"
            if short_prefix_search
            else f"{field} ILIKE %(search_contains)s"
            if contains_search
            else (
                f"to_tsvector('simple', coalesce({field}, '')) "
                "@@ to_tsquery('simple', %(search_tsquery)s)"
            )
        )
        fuzzy = (
            (
                f"to_tsvector('simple', coalesce({field}, '')) "
                "@@ to_tsquery('simple', %(search_fuzzy_initial_tsquery)s) AND "
                + " AND ".join(
                    f"%(search_fuzzy_{index})s::text "
                    f"OPERATOR(extensions.<%%) {field}"
                    for index in range(len(fuzzy_tokens))
                )
            )
            if fuzzy_tokens
            else None
        )
        return exact, fuzzy

    exact_candidates: list[str] = []
    unbounded_exact_candidates: list[str] = []
    fuzzy_candidates: list[str] = []
    unbounded_fuzzy_candidates: list[str] = []

    def fuzzy_rank_sql(field: str, source_priority: int) -> str:
        scores = " + ".join(
            f"extensions.word_similarity(%(search_fuzzy_{index})s::text, {field})"
            for index in range(len(fuzzy_tokens))
        )
        return (
            f"{source_priority} + 100 * "
            f"(({scores}) / {len(fuzzy_tokens)})"
        )

    current_source = (
        "filtered_companies s"
        if restrict_to_filtered
        else "core.company_current s"
    )

    name_sources = [("s.company_name", "company_name", DISPLAY_NAME_PRIORITY)]

    if not displayed_name_only:
        name_sources.append(
            ("s.registered_name", "registered_name", REGISTERED_NAME_PRIORITY)
        )

    for field, match_source, source_priority in name_sources:
        exact, fuzzy = conditions(field)
        exact_candidate_args = dict(
            from_sql=current_source,
            company_id_sql="s.company_id",
            field_sql=field,
            condition=exact,
            source_priority=source_priority,
            match_source=match_source,
            rank_sql=str(source_priority) if short_prefix_search else None,
        )
        if short_prefix_search or contains_search:
            unbounded_exact_candidates.append(
                _field_count_candidate(
                    from_sql=current_source,
                    company_id_sql="s.company_id",
                    condition=exact,
                )
            )
        exact_candidates.append(
            _field_candidate(
                **exact_candidate_args,
                tail_sql="LIMIT %(search_candidate_limit)s",
            )
        )
        if fuzzy:
            fuzzy_candidate_args = dict(
                from_sql=current_source,
                company_id_sql="s.company_id",
                field_sql=field,
                condition=fuzzy,
                source_priority=source_priority,
                match_source=match_source,
                rank_sql=fuzzy_rank_sql(field, source_priority),
            )
            unbounded_fuzzy_candidates.append(
                _field_count_candidate(
                    from_sql=current_source,
                    company_id_sql="s.company_id",
                    condition=fuzzy,
                )
            )
            fuzzy_candidates.append(
                _field_candidate(
                    **fuzzy_candidate_args,
                    tail_sql="LIMIT %(search_candidate_limit)s",
                )
            )

    direct_exact_matches_sql = _deduplicate(
        " UNION ALL ".join(exact_candidates)
    )

    if not short_prefix_search and not contains_search:
        combined_current_condition = (
            "to_tsvector('simple', "
            "coalesce(s.company_name, '') || ' ' || "
            "coalesce(s.registered_name, '')) "
            "@@ to_tsquery('simple', %(search_tsquery)s)"
        )
        unbounded_exact_candidates.append(
            _field_count_candidate(
                from_sql=current_source,
                company_id_sql="s.company_id",
                condition=combined_current_condition,
            )
        )

    if not displayed_name_only:
        exact, fuzzy = conditions("n.name")
        alias_history_from_sql = (
            "src_bolagsverket.organization_name n "
            "JOIN src_bolagsverket.organization_history h "
            "ON h.id = n.organization_history_id"
        )
        alias_from_sql = alias_history_from_sql
        alias_count_from_sql = alias_history_from_sql
        if restrict_to_filtered:
            filter_join = (
                " JOIN filtered_companies filter_scope "
                "ON filter_scope.company_id = h.company_id"
            )
            alias_from_sql += filter_join
            alias_count_from_sql += filter_join
        alias_exact = f"h.valid_to IS NULL AND {exact}"
        alias_candidate_args = dict(
            from_sql=alias_from_sql,
            company_id_sql="h.company_id",
            field_sql="n.name",
            condition=alias_exact,
            source_priority=ALIAS_PRIORITY,
            match_source="alias",
            rank_sql=str(ALIAS_PRIORITY) if short_prefix_search else None,
        )
        unbounded_exact_candidates.append(
            _field_count_candidate(
                from_sql=alias_count_from_sql,
                company_id_sql="h.company_id",
                condition=alias_exact,
            )
        )
        exact_candidates.append(
            _field_candidate(
                **alias_candidate_args,
                tail_sql="LIMIT %(search_candidate_limit)s",
            )
        )
        if fuzzy:
            alias_fuzzy = f"h.valid_to IS NULL AND {fuzzy}"
            fuzzy_candidate_args = dict(
                from_sql=alias_from_sql,
                company_id_sql="h.company_id",
                field_sql="n.name",
                condition=alias_fuzzy,
                source_priority=ALIAS_PRIORITY,
                match_source="alias",
                rank_sql=fuzzy_rank_sql("n.name", ALIAS_PRIORITY),
            )
            unbounded_fuzzy_candidates.append(
                _field_count_candidate(
                    from_sql=alias_count_from_sql,
                    company_id_sql="h.company_id",
                    condition=alias_fuzzy,
                )
            )
            fuzzy_candidates.append(
                _field_candidate(
                    **fuzzy_candidate_args,
                    tail_sql="LIMIT %(search_candidate_limit)s",
                )
            )

    expanded_exact_matches_sql = _deduplicate(
        " UNION ALL ".join(exact_candidates)
    )
    return CompanySearchPlan(
        matches_sql=direct_exact_matches_sql,
        expanded_matches_sql=(
            expanded_exact_matches_sql if not displayed_name_only else None
        ),
        params=params,
        count_matches_sql=_count_candidates(unbounded_exact_candidates),
        fuzzy_matches_sql=(
            _deduplicate(" UNION ALL ".join(fuzzy_candidates))
            if fuzzy_candidates
            else None
        ),
        fuzzy_count_matches_sql=(
            _count_candidates(unbounded_fuzzy_candidates)
            if unbounded_fuzzy_candidates
            else None
        ),
        autocomplete=False,
    )


def build_company_search(
    query: str,
    search_by: str,
    *,
    candidate_limit: int = 1000,
    restrict_to_filtered: bool = False,
) -> CompanySearchPlan:
    """Return an indexed candidate plan for ``all``, name or identity search."""

    normalized_query = query.strip()
    identity = _identity_digits(normalized_query)

    if search_by == "org_nr":
        return (
            _identity_plan(identity, restrict_to_filtered=restrict_to_filtered)
            if identity
            else _empty_plan()
        )
    if search_by == "all" and identity:
        return _identity_plan(
            identity, restrict_to_filtered=restrict_to_filtered
        )
    return _name_plan(
        normalized_query,
        candidate_limit=max(1, candidate_limit),
        restrict_to_filtered=restrict_to_filtered,
    )


def configure_company_search(cursor, plan: CompanySearchPlan) -> None:
    """Set the transaction-local fuzzy threshold used by indexed trigram operators."""

    if plan.uses_fuzzy_matching:
        cursor.execute(
            "SELECT set_config('pg_trgm.word_similarity_threshold', %s, true)",
            (str(FUZZY_WORD_THRESHOLD),),
        )
