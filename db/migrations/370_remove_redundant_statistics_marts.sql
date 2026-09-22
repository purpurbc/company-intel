-- The two views below were exact pass-through aliases of typed app views.
-- They added a second name for the same contract without an analytical grain.
-- Keep transformed/unpivoted statistics in mart and typed source reads in app.
DROP VIEW IF EXISTS mart.bolagsverket_auditor_reservation_statistics;
DROP VIEW IF EXISTS mart.bolagsverket_filing_delay_statistics;
