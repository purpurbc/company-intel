-- Filtered pagination should narrow the current-state set before sorting it.
-- County, activity status and company age are commonly combined in saved
-- segments. Without a shared access path PostgreSQL may walk a broad metric
-- index, discard most rows and become progressively slower at later offsets.
CREATE INDEX company_current_geography_activity_age
ON core.company_state_history (
    seat_county_code,
    activity_status_code,
    (COALESCE(start_date, scb_registration_date)) DESC,
    turnover_class_code,
    company_name,
    company_id
)
INCLUDE (state_id, employee_size_code)
WHERE valid_to IS NULL;

-- Teach the planner that geography, registry status, age and turnover are not
-- independent. This prevents optimistic row estimates from favouring a broad
-- sort index for selective multi-filter searches.
CREATE STATISTICS company_current_pagination_filter_stats (dependencies, mcv)
ON seat_county_code,
   activity_status_code,
   turnover_class_code,
   (COALESCE(start_date, scb_registration_date))
FROM core.company_state_history;

ANALYZE core.company_state_history;

