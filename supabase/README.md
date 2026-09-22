# Database migrations

The only active SQL migration chain is `db/migrations/`.
Use `python -m db.migrate` with the direct PostgreSQL connection URL for Supabase.

Do not use `supabase db push/reset` for this project: the previous duplicate chain
has been consolidated. Do not erase Supabase's remote migration ledger.

The application uses FastAPI and a PostgreSQL connection, not automatically
exposed PostgREST tables. Do not add `raw`, `src_scb`, `src_bolagsverket`, `core`
or `meta` to the schemas exposed to anonymous clients. They contain personal
identifiers, import metadata and original source material.
