# Cintela

Cintela samlar officiell svensk företagsdata för sök, historik och
marknadsöversikter. Källorna är främst SCB:s företagsregister och
Bolagsverkets bulk- och statistikfiler.

## Struktur

- `api/` – FastAPI och publika svarskontrakt.
- `web/` – Next.js-gränssnitt.
- `worker/` – validerade och återstartningsbara importer.
- `db/` – PostgreSQL-migreringar och datamodell.
- `tests/` – kontrakts-, tjänste- och integrationsprov.

## Lokal start

```powershell
docker compose up -d
python -m pip install -r worker/requirements.txt -r api/requirements.txt
python -m db.migrate
npm install
npm run dev:api
```

Starta webbgränssnittet i en separat terminal:

```powershell
npm run dev
```

Kopiera relevanta värden från `.env.example` till `.env` och sätt
`NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000` i `web/.env.local`.

`GET /health` är processens liveness-kontroll. `GET /health/db` verifierar
databasanslutning och obligatoriska schemaobjekt och ska användas för readiness.

## Importer

```powershell
python -m worker.run_bulk_import --scb data/scb_bulkfil.zip --bolagsverket data/bolagsverket_bulkfil.zip --resume
python -m worker.run_scb_update
python -m worker.run_bolagsverket_statistics_import --download-official
```

Alla observationer i en import använder körningens `started_at` som
`observed_at`. Källans referensdatum lagras separat som `source_as_of_date`, och
verksamhetshändelser använder `effective_at`. Lyckade importer invaliderar och
förvärmer de globala översiktscacherna.

Läs [databasguiden](db/README.md) före schemaändringar och
[statistikguiden](docs/bolagsverket-statistik.md) för Bolagsverkets aggregerade
statistik.

## Kontroll

```powershell
python -m pytest
npm run lint
npm run build
```
