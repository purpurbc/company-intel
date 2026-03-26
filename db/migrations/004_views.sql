-- 004_views.sql
-- Read-friendly view with labels joined from dimension tables.
BEGIN;

-- Slim view for list/search/filter UI
CREATE OR REPLACE VIEW v_company AS
SELECT
  c.org_nr,
  c.pe_org_nr,
  c.company_name,
  c.post_ort,

  c.seat_county_code,
  co.name AS seat_county_name,

  c.seat_municipality_code,
  mu.name AS seat_municipality_name,

  c.aregion_code,
  ar.name AS aregion_name,

  c.avdelning_1_code,
  i2.name AS industry_2_name,

  c.bransch_1_code,
  i5.name AS industry_5_name,

  c.size_class_code,
  sc.name AS size_class_name,

  c.turnover_size_code,
  tg.name AS turnover_gross_name,

  c.turnover_fin_size_code,
  tf.name AS turnover_fin_name,

  c.legal_form_code,
  lf.name AS legal_form_name,

  c.sector_code,
  se.name AS sector_name,

  c.company_status_code,
  cs.name AS company_status_name,

  c.company_state_code,
  st.name AS company_state_name,

  c.ingested_at,

  c.employer_status_code,
  es.name AS employer_status_name

FROM company c
LEFT JOIN dim_county co ON co.code = c.seat_county_code
LEFT JOIN dim_municipality mu ON mu.code = c.seat_municipality_code
LEFT JOIN dim_aregion ar ON ar.code = c.aregion_code
LEFT JOIN dim_industry_2 i2 ON i2.code = c.avdelning_1_code
LEFT JOIN dim_industry_5 i5 ON i5.code = c.bransch_1_code
LEFT JOIN dim_size_class sc ON sc.code = c.size_class_code
LEFT JOIN dim_turnover_gross tg ON tg.code = c.turnover_size_code
LEFT JOIN dim_turnover_fin tf ON tf.code = c.turnover_fin_size_code
LEFT JOIN dim_legal_form lf ON lf.code = c.legal_form_code
LEFT JOIN dim_sector se ON se.code = c.sector_code
LEFT JOIN dim_company_status cs ON cs.code = c.company_status_code
LEFT JOIN dim_company_state st ON st.code = c.company_state_code
LEFT JOIN dim_employer_status es ON es.code = c.employer_status_code;

-- Full view for detail pages (everything + labels)
CREATE OR REPLACE VIEW v_company_full AS
SELECT
  c.*,

  co.name AS seat_county_name,
  mu.name AS seat_municipality_name,
  ar.name AS aregion_name,

  i2.name AS avdelning_1_name_dim,
  i5.name AS bransch_1_name_dim,
  i5.code_p AS bransch_1p_code_dim,

  sc.name AS size_class_name_dim,
  tg.name AS turnover_gross_name_dim,
  tf.name AS turnover_fin_name_dim,

  lf.name AS legal_form_name_dim,
  se.name AS sector_name_dim,

  cs.name AS company_status_name_dim,
  st.name AS company_state_name_dim

FROM company c
LEFT JOIN dim_county co ON co.code = c.seat_county_code
LEFT JOIN dim_municipality mu ON mu.code = c.seat_municipality_code
LEFT JOIN dim_aregion ar ON ar.code = c.aregion_code
LEFT JOIN dim_industry_2 i2 ON i2.code = c.avdelning_1_code
LEFT JOIN dim_industry_5 i5 ON i5.code = c.bransch_1_code
LEFT JOIN dim_size_class sc ON sc.code = c.size_class_code
LEFT JOIN dim_turnover_gross tg ON tg.code = c.turnover_size_code
LEFT JOIN dim_turnover_fin tf ON tf.code = c.turnover_fin_size_code
LEFT JOIN dim_legal_form lf ON lf.code = c.legal_form_code
LEFT JOIN dim_sector se ON se.code = c.sector_code
LEFT JOIN dim_company_status cs ON cs.code = c.company_status_code
LEFT JOIN dim_company_state st ON st.code = c.company_state_code;

COMMIT;