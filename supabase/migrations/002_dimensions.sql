-- 002_dimensions.sql
-- Dimension tables for commonly filtered/displayed code+label fields.
BEGIN;

-- Län (säte)
CREATE TABLE IF NOT EXISTS dim_county (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Kommun (säte)
CREATE TABLE IF NOT EXISTS dim_municipality (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  county_code TEXT NULL REFERENCES dim_county(code)
);

-- ARegion
CREATE TABLE IF NOT EXISTS dim_aregion (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- 2-siffrig bransch (Avdelning_1)
CREATE TABLE IF NOT EXISTS dim_industry_2 (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- 5-siffrig bransch (Bransch_1)
CREATE TABLE IF NOT EXISTS dim_industry_5 (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code_p TEXT NULL,                 -- bransch_1p_code
  industry_2_code TEXT NULL REFERENCES dim_industry_2(code) -- avdelning_1_code
);

-- Storleksklass (anställda bucket)
CREATE TABLE IF NOT EXISTS dim_size_class (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Omsättningsklass grov (turnover_size_code)
CREATE TABLE IF NOT EXISTS dim_turnover_gross (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Omsättningsklass fin (turnover_fin_size_code)
CREATE TABLE IF NOT EXISTS dim_turnover_fin (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Juridisk form
CREATE TABLE IF NOT EXISTS dim_legal_form (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Sektor
CREATE TABLE IF NOT EXISTS dim_sector (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Företagsstatus
CREATE TABLE IF NOT EXISTS dim_company_status (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Bolagsstatus
CREATE TABLE IF NOT EXISTS dim_company_state (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Arbetsgivarstatus
CREATE TABLE IF NOT EXISTS dim_employer_status (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

COMMIT;