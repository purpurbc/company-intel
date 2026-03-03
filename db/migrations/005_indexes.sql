BEGIN;

CREATE INDEX IF NOT EXISTS idx_company_seat_county_code       ON company(seat_county_code);
CREATE INDEX IF NOT EXISTS idx_company_seat_municipality_code ON company(seat_municipality_code);
CREATE INDEX IF NOT EXISTS idx_company_aregion_code           ON company(aregion_code);

CREATE INDEX IF NOT EXISTS idx_company_avdelning_1_code       ON company(avdelning_1_code);
CREATE INDEX IF NOT EXISTS idx_company_bransch_1_code         ON company(bransch_1_code);

CREATE INDEX IF NOT EXISTS idx_company_turnover_fin_size_code ON company(turnover_fin_size_code);
CREATE INDEX IF NOT EXISTS idx_company_sector_code            ON company(sector_code);
CREATE INDEX IF NOT EXISTS idx_company_legal_form_code        ON company(legal_form_code);
CREATE INDEX IF NOT EXISTS idx_company_company_state_code     ON company(company_state_code);

DROP INDEX IF EXISTS idx_company_sni2;
DROP INDEX IF EXISTS idx_company_employees;

COMMIT;