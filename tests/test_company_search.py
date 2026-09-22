from api.services.company_search import (
    ALIAS_PRIORITY,
    DISPLAY_NAME_PRIORITY,
    REGISTERED_NAME_PRIORITY,
    build_company_search,
)


def test_person_number_in_all_search_uses_only_identity_indexes():
    plan = build_company_search("900101-0011", "all")

    assert plan.params == {"search_identity": "9001010011"}
    assert "company_identifier" in plan.matches_sql
    assert "to_tsvector" not in plan.matches_sql


def test_name_search_is_unordered_prefix_and_fuzzy():
    plan = build_company_search("Anna Bergström", "all")

    assert plan.params["search_tsquery"] == "anna:* & bergström:*"
    assert plan.params["search_first_prefix"] == "anna%"
    assert not plan.uses_fuzzy_matching
    assert plan.fuzzy_matches_sql
    assert "to_tsquery" in plan.matches_sql
    assert "OPERATOR(extensions.<%%)" in plan.fuzzy_matches_sql


def test_name_search_ranks_main_and_registered_names_before_aliases():
    plan = build_company_search("Vium AB", "all")

    assert plan.params["search_plain_query"] == "vium ab"
    assert plan.params["search_normalized_name"] == "vium ab"
    assert "900" in plan.matches_sql
    assert "600" in plan.matches_sql
    assert "'company_name'::text AS match_source" in plan.matches_sql
    assert f"{DISPLAY_NAME_PRIORITY}::smallint AS source_priority" in plan.matches_sql
    assert "'registered_name'::text AS match_source" in plan.matches_sql
    assert f"{REGISTERED_NAME_PRIORITY}::smallint AS source_priority" in plan.matches_sql
    assert "'alias'::text AS match_source" not in plan.matches_sql
    assert plan.expanded_matches_sql is not None
    assert "'alias'::text AS match_source" in plan.expanded_matches_sql
    assert (
        f"{ALIAS_PRIORITY}::smallint AS source_priority"
        in plan.expanded_matches_sql
    )
    assert DISPLAY_NAME_PRIORITY > REGISTERED_NAME_PRIORITY > ALIAS_PRIORITY
    assert "DISTINCT ON (company_id)" in plan.matches_sql


def test_short_name_search_has_no_minimum_length_or_unindexed_scan():
    plan = build_company_search("A", "company_name")

    assert plan.autocomplete is False
    assert plan.params["search_tsquery"] == "a:*"
    assert not plan.uses_fuzzy_matching
    assert "search_short_prefix" in plan.params
    assert "ILIKE" not in plan.matches_sql
    assert "organization_name" not in plan.matches_sql


def test_three_character_search_is_bounded_and_keeps_aliases():
    plan = build_company_search("Ant", "all", candidate_limit=500)

    assert plan.autocomplete is False
    assert plan.params["search_candidate_limit"] == 500
    assert "organization_name" not in plan.matches_sql
    assert plan.expanded_matches_sql is not None
    assert "organization_name" in plan.expanded_matches_sql
    assert "LIMIT %(search_candidate_limit)s" in plan.matches_sql


def test_filtered_name_search_resolves_candidates_inside_filter_scope():
    plan = build_company_search(
        "bygg",
        "all",
        candidate_limit=500,
        restrict_to_filtered=True,
    )

    assert "filtered_companies" in plan.matches_sql
    assert "FROM filtered_companies s" in plan.matches_sql
    assert plan.expanded_matches_sql is not None
    assert "filter_scope.company_id = h.company_id" in plan.expanded_matches_sql


def test_legal_form_is_kept_exact_but_ignored_for_fuzzy_candidates():
    plan = build_company_search("Vium AB", "all")

    assert plan.params["search_tsquery"] == "vium:* & ab:*"
    assert plan.params["search_fuzzy_0"] == "vium"
    assert "search_fuzzy_1" not in plan.params


def test_fuzzy_result_candidates_are_bounded_but_total_is_not():
    plan = build_company_search("Vium AB", "all", candidate_limit=240)
    fallback = plan.fuzzy_fallback()

    assert fallback is not None
    assert plan.params["search_candidate_limit"] == 240
    assert "LIMIT %(search_candidate_limit)s" in fallback.matches_sql
    assert fallback.count_matches_sql is not None
    assert "LIMIT %(search_candidate_limit)s" not in fallback.count_matches_sql
    assert "OPERATOR(extensions.<%%)" in fallback.matches_sql
    assert plan.params["search_fuzzy_prefix_0"] == "viu%"
