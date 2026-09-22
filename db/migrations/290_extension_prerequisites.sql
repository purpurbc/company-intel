-- PostgreSQL 13+ provides gen_random_uuid in pg_catalog, so a clean database
-- may not yet have pgcrypto even though upgraded databases do. Install it
-- before migration 300 moves infrastructure extensions out of public.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
