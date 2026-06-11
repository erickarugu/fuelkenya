# FuelKenya API

This backend is built with FastAPI and structured for easy growth.

## Run locally

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Example routes

- `GET /api/v1/health`
- `GET /api/v1/welcome`
- `POST /api/v1/ingest/csv`
- `GET /api/v1/prices`
- `GET /api/v1/prices/latest`
- `GET /api/v1/towns`

## Environment

Copy `.env.example` to `.env` and update `DATABASE_URL` for your PostgreSQL database. If you want to protect ingestion, set `INGEST_TOKEN` and send `Authorization: Bearer <token>` when calling `/api/v1/ingest/csv`.

To enable SQL query logging, add `SQL_ECHO=true` to `.env`.

## Rate limiting

For public API usage, the backend enforces a default limit of `60` requests per minute per client IP. You can adjust this behavior by setting:

- `RATE_LIMIT_MAX_REQUESTS`
- `RATE_LIMIT_WINDOW_SECONDS`

Health checks at `/api/v1/health` are exempt from rate limiting by default.

## Database migrations

Initialize and apply the schema with Alembic:

```bash
cd api
source .venv/bin/activate
alembic upgrade head
```

If you add models later, generate a new migration from the `api/` folder:

```bash
cd api
source .venv/bin/activate
alembic revision --autogenerate -m "describe change"
```
