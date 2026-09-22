-- Never-active companies are heavily skewed toward the lowest turnover class.
-- A global turnover index therefore reads hundreds of thousands of active
-- companies before finding one page of matches. Keep this focused partial
-- index small and cover the columns needed to page before the wide list joins.
CREATE INDEX company_current_never_active_turnover_desc
ON core.company_state_history (
    (turnover_class_code::integer) DESC NULLS LAST,
    company_name ASC NULLS LAST,
    company_id
)
INCLUDE (state_id, company_state_code, employee_size_code)
WHERE valid_to IS NULL
  AND activity_status_code = '0';

ANALYZE core.company_state_history (
    activity_status_code,
    company_state_code,
    turnover_class_code
);
