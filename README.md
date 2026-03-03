# Company Intel
Business focused tool to retrieve company insights and evaluations.
Very much a WIP.

Utilizes: 
- SCB företagsregister (SokPaVar)
- PostgreSQL
- FastAPI
- Next.js

- Future implementations/ideas
    - AI evaluation
    - Retrive company website (unsure how, dont want to scrape...)
    - Google Page Speed Insights for company website evaluation

---
## Architecture
company-intel/
- api/ → FastAPI backend
- web/ → Next.js frontend
- worker/ → SCB data gathering
- db/ → SQL migrations
---
## 1. Database Setup (Docker)
From root:
docker compose up -d

Apply migrations:
psql "postgresql://app:app@localhost:5432/companyintel" -f db/migrations/001_init.sql
psql "postgresql://app:app@localhost:5432/companyintel" -f db/migrations/002_dimensions.sql
psql "postgresql://app:app@localhost:5432/companyintel" -f db/migrations/003_backfill_dimensions.sql
psql "postgresql://app:app@localhost:5432/companyintel" -f db/migrations/004_views.sql
psql "postgresql://app:app@localhost:5432/companyintel" -f db/migrations/005_indexes.sql

## 2. Backend (FastAPI)
Install dependencies:
pip install -r api/requirements.txt

Create .env in repo root:
see .env.example. Need to apply for access to SCB

Run API:
uvicorn api.main:app --reload --port 8000

## 3. Frontend (Next.js)
cd web
npm install

Create web/.env.local:
NEXT_PUBLIC_API_BASE=http://localhost:8000

Run:
npm run dev

Open:
http://localhost:3000

API Endpoints (MVP)
GET /health
GET /company/{org_nr}
...