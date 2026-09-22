-- Aggregate the two wide monthly statistics files before unpivoting them.
-- The former normal views expanded every source row into 26/29 rows on each
-- page request. These materialized marts keep the useful analytical grain and
-- move that fixed cost to the monthly import transaction.

DROP VIEW IF EXISTS mart.bolagsverket_company_statistics_by_form;
DROP VIEW IF EXISTS mart.bolagsverket_representative_statistics_by_role;

CREATE MATERIALIZED VIEW mart.bolagsverket_company_statistics_monthly AS
WITH totals AS (
    SELECT
        statistics.period_start,
        statistics.event_code,
        sum(statistics.count_ab)::bigint AS count_ab,
        sum(statistics.count_bab)::bigint AS count_bab,
        sum(statistics.count_bf)::bigint AS count_bf,
        sum(statistics.count_brf)::bigint AS count_brf,
        sum(statistics.count_ek)::bigint AS count_ek,
        sum(statistics.count_e)::bigint AS count_e,
        sum(statistics.count_se)::bigint AS count_se,
        sum(statistics.count_fl)::bigint AS count_fl,
        sum(statistics.count_fab)::bigint AS count_fab,
        sum(statistics.count_hb)::bigint AS count_hb,
        sum(statistics.count_i)::bigint AS count_i,
        sum(statistics.count_kb)::bigint AS count_kb,
        sum(statistics.count_khf)::bigint AS count_khf,
        sum(statistics.count_mb)::bigint AS count_mb,
        sum(statistics.count_sf)::bigint AS count_sf,
        sum(statistics.count_sb)::bigint AS count_sb,
        sum(statistics.count_tsf)::bigint AS count_tsf,
        sum(statistics.count_bfl)::bigint AS count_bfl,
        sum(statistics.count_ofb)::bigint AS count_ofb,
        sum(statistics.count_sce)::bigint AS count_sce,
        sum(statistics.count_s)::bigint AS count_s,
        sum(statistics.count_egts)::bigint AS count_egts,
        sum(statistics.count_fof)::bigint AS count_fof,
        sum(statistics.count_tpab)::bigint AS count_tpab,
        sum(statistics.count_otpb)::bigint AS count_otpb,
        sum(statistics.count_tpf)::bigint AS count_tpf
    FROM app.bolagsverket_company_statistics statistics
    GROUP BY statistics.period_start, statistics.event_code
)
SELECT
    totals.period_start,
    totals.event_code,
    event.name AS event_name,
    form.organization_form_code,
    dimension.name AS organization_form_name,
    form.company_count
FROM totals
LEFT JOIN app.dim_bolagsverket_statistics_event event
    ON event.code = totals.event_code
CROSS JOIN LATERAL (VALUES
    ('AB', totals.count_ab),
    ('BAB', totals.count_bab),
    ('BF', totals.count_bf),
    ('BRF', totals.count_brf),
    ('EK', totals.count_ek),
    ('E', totals.count_e),
    ('SE', totals.count_se),
    ('FL', totals.count_fl),
    ('FAB', totals.count_fab),
    ('HB', totals.count_hb),
    ('I', totals.count_i),
    ('KB', totals.count_kb),
    ('KHF', totals.count_khf),
    ('MB', totals.count_mb),
    ('SF', totals.count_sf),
    ('SB', totals.count_sb),
    ('TSF', totals.count_tsf),
    ('BFL', totals.count_bfl),
    ('OFB', totals.count_ofb),
    ('SCE', totals.count_sce),
    ('S', totals.count_s),
    ('EGTS', totals.count_egts),
    ('FOF', totals.count_fof),
    ('TPAB', totals.count_tpab),
    ('OTPB', totals.count_otpb),
    ('TPF', totals.count_tpf)
) AS form(organization_form_code, company_count)
LEFT JOIN app.dim_bolagsverket_statistics_organization_form dimension
    ON dimension.code = form.organization_form_code
WHERE form.company_count IS NOT NULL;

CREATE UNIQUE INDEX bolagsverket_company_statistics_monthly_key
    ON mart.bolagsverket_company_statistics_monthly(
        period_start, event_code, organization_form_code
    );

CREATE MATERIALIZED VIEW mart.bolagsverket_representative_statistics_yearly AS
WITH totals AS (
    SELECT
        statistics.year,
        sum(statistics.count_ak)::bigint AS count_ak,
        sum(statistics.count_bo)::bigint AS count_bo,
        sum(statistics.count_delg)::bigint AS count_delg,
        sum(statistics.count_eft)::bigint AS count_eft,
        sum(statistics.count_evd)::bigint AS count_evd,
        sum(statistics.count_evvd)::bigint AS count_evvd,
        sum(statistics.count_fo)::bigint AS count_fo,
        sum(statistics.count_in)::bigint AS count_in,
        sum(statistics.count_kd)::bigint AS count_kd,
        sum(statistics.count_kp)::bigint AS count_kp,
        sum(statistics.count_le)::bigint AS count_le,
        sum(statistics.count_li)::bigint AS count_li,
        sum(statistics.count_ls)::bigint AS count_ls,
        sum(statistics.count_of)::bigint AS count_of,
        sum(statistics.count_po)::bigint AS count_po,
        sum(statistics.count_rep)::bigint AS count_rep,
        sum(statistics.count_rev)::bigint AS count_rev,
        sum(statistics.count_revh)::bigint AS count_revh,
        sum(statistics.count_revl)::bigint AS count_revl,
        sum(statistics.count_revs)::bigint AS count_revs,
        sum(statistics.count_revsl)::bigint AS count_revsl,
        sum(statistics.count_revst)::bigint AS count_revst,
        sum(statistics.count_revt)::bigint AS count_revt,
        sum(statistics.count_su)::bigint AS count_su,
        sum(statistics.count_svd)::bigint AS count_svd,
        sum(statistics.count_vd)::bigint AS count_vd,
        sum(statistics.count_vle)::bigint AS count_vle,
        sum(statistics.count_vof)::bigint AS count_vof,
        sum(statistics.count_vvd)::bigint AS count_vvd
    FROM app.bolagsverket_representative_statistics statistics
    GROUP BY statistics.year
)
SELECT
    totals.year,
    role.representative_role_code,
    dimension.name AS representative_role_name,
    role.representative_count
FROM totals
CROSS JOIN LATERAL (VALUES
    ('AK', totals.count_ak),
    ('BO', totals.count_bo),
    ('DELG', totals.count_delg),
    ('EFT', totals.count_eft),
    ('EVD', totals.count_evd),
    ('EVVD', totals.count_evvd),
    ('FO', totals.count_fo),
    ('IN', totals.count_in),
    ('KD', totals.count_kd),
    ('KP', totals.count_kp),
    ('LE', totals.count_le),
    ('LI', totals.count_li),
    ('LS', totals.count_ls),
    ('OF', totals.count_of),
    ('PO', totals.count_po),
    ('REP', totals.count_rep),
    ('REV', totals.count_rev),
    ('REVH', totals.count_revh),
    ('REVL', totals.count_revl),
    ('REVS', totals.count_revs),
    ('REVSL', totals.count_revsl),
    ('REVST', totals.count_revst),
    ('REVT', totals.count_revt),
    ('SU', totals.count_su),
    ('SVD', totals.count_svd),
    ('VD', totals.count_vd),
    ('VLE', totals.count_vle),
    ('VOF', totals.count_vof),
    ('VVD', totals.count_vvd)
) AS role(representative_role_code, representative_count)
LEFT JOIN app.dim_bolagsverket_representative_role dimension
    ON dimension.code = role.representative_role_code
WHERE role.representative_count <> 0;

CREATE UNIQUE INDEX bolagsverket_representative_statistics_yearly_key
    ON mart.bolagsverket_representative_statistics_yearly(
        year, representative_role_code
    );

COMMENT ON MATERIALIZED VIEW mart.bolagsverket_company_statistics_monthly IS
    'National monthly totals by event and company form; refreshed after the companies statistics import.';
COMMENT ON MATERIALIZED VIEW mart.bolagsverket_representative_statistics_yearly IS
    'National yearly role totals; refreshed after the representatives statistics import.';
