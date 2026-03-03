-- 003_backfill_dimensions.sql
-- Backfill dimension tables from existing company table.
-- Assumes company has code+label columns as in CompanyJE dataclass.
BEGIN;

-- County
INSERT INTO dim_county(code, name)
SELECT DISTINCT seat_county_code, seat_county
FROM company
WHERE seat_county_code IS NOT NULL AND seat_county IS NOT NULL
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- Municipality (link county_code when possible)
INSERT INTO dim_municipality(code, name, county_code)
SELECT DISTINCT seat_municipality_code, seat_municipality, seat_county_code
FROM company
WHERE seat_municipality_code IS NOT NULL AND seat_municipality IS NOT NULL
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    county_code = COALESCE(EXCLUDED.county_code, dim_municipality.county_code);

-- ARegion
INSERT INTO dim_aregion(code, name)
SELECT DISTINCT aregion_code, aregion
FROM company
WHERE aregion_code IS NOT NULL AND aregion IS NOT NULL
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- Industry 2-digit (Avdelning_1)
INSERT INTO dim_industry_2(code, name)
SELECT DISTINCT avdelning_1_code, avdelning_1
FROM company
WHERE avdelning_1_code IS NOT NULL AND avdelning_1 IS NOT NULL
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- Industry 5-digit (Bransch_1)
INSERT INTO dim_industry_5(code, name, code_p, industry_2_code)
SELECT DISTINCT bransch_1_code, bransch_1, bransch_1p_code, avdelning_1_code
FROM company
WHERE bransch_1_code IS NOT NULL AND bransch_1 IS NOT NULL
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    code_p = COALESCE(EXCLUDED.code_p, dim_industry_5.code_p),
    industry_2_code = COALESCE(EXCLUDED.industry_2_code, dim_industry_5.industry_2_code);

-- Size class
INSERT INTO dim_size_class(code, name)
SELECT DISTINCT size_class_code, size_class
FROM company
WHERE size_class_code IS NOT NULL AND size_class IS NOT NULL
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- Turnover gross
INSERT INTO dim_turnover_gross(code, name)
SELECT DISTINCT turnover_size_code, turnover_size
FROM company
WHERE turnover_size_code IS NOT NULL AND turnover_size IS NOT NULL
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- Turnover fin
INSERT INTO dim_turnover_fin(code, name)
SELECT DISTINCT turnover_fin_size_code, turnover_fin_size
FROM company
WHERE turnover_fin_size_code IS NOT NULL AND turnover_fin_size IS NOT NULL
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- Legal form
INSERT INTO dim_legal_form(code, name)
SELECT DISTINCT legal_form_code, legal_form
FROM company
WHERE legal_form_code IS NOT NULL AND legal_form IS NOT NULL
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- Sector
INSERT INTO dim_sector(code, name)
SELECT DISTINCT sector_code, sector
FROM company
WHERE sector_code IS NOT NULL AND sector IS NOT NULL
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- Company status
INSERT INTO dim_company_status(code, name)
SELECT DISTINCT company_status_code, company_status
FROM company
WHERE company_status_code IS NOT NULL AND company_status IS NOT NULL
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- Company state
INSERT INTO dim_company_state(code, name)
SELECT DISTINCT company_state_code, company_state
FROM company
WHERE company_state_code IS NOT NULL AND company_state IS NOT NULL
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

COMMIT;