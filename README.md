# FuelKenya

Live EPRA maximum pump fuel prices across all towns in Kenya — updated every pricing cycle.

**[fuelkenya.com](https://fuelkenya.com)** · **[docs.fuelkenya.com](https://docs.fuelkenya.com)** · **[API](https://api.fuelkenya.com/v1)**

---

## What this is

FuelKenya is an open-source tracker for official fuel prices published by Kenya's [Energy & Petroleum Regulatory Authority (EPRA)](https://www.epra.go.ke). Prices are set monthly (cycles run from the 15th of each month to the 14th of the next) and cover Super Petrol, Diesel, and Kerosene across 224+ towns.

The project has three parts:

| Package | Description | Stack |
|---|---|---|
| [`api/`](./api) | REST API — ingests EPRA CSVs, serves price data | FastAPI, PostgreSQL, Alembic |
| [`web/`](./web) | Public price tracker dashboard | Next.js 14, Tailwind CSS |
| [`docs/`](./docs) | API documentation site | Nextra (MDX), static export |

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| pnpm | 11+ |
| Python | 3.11+ |
| PostgreSQL | 14+ |

Install pnpm globally if you don't have it:

```bash
npm install -g pnpm
```

---

## Quick start

### 1. Clone

```bash
git clone https://github.com/erickarugu/fuelkenya.git
cd fuelkenya
```

### 2. API

```bash
cd api

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env: set DATABASE_URL and INGEST_TOKEN

# Run database migrations
alembic upgrade head

# Start the dev server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is now running at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 3. Web

```bash
cd web
pnpm install

# Set the API base URL (defaults to http://localhost:8000/v1)
echo 'NEXT_PUBLIC_FUELKENYA_API_URL=http://localhost:8000/v1' > .env.local

pnpm dev
```

Dashboard at `http://localhost:3000`.

### 4. Docs (optional)

```bash
cd docs
pnpm install
pnpm dev
```

Docs at `http://localhost:3001`.

---

## Environment variables

### `api/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (`postgresql+asyncpg://user:pass@host:5432/db`) |
| `INGEST_TOKEN` | Yes | — | Bearer token for `POST /v1/ingest/csv` |
| `LOG_LEVEL` | No | `INFO` | Logging level |
| `SQL_ECHO` | No | `true` | Log SQL queries (set `false` in production) |

### `web/.env.local`

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_FUELKENYA_API_URL` | No | `http://localhost:8000/v1` | API base URL |

---

## Project structure

```
fuelkenya/
├── api/                        # FastAPI backend
│   ├── app/
│   │   ├── api/v1/endpoints.py # Route handlers
│   │   ├── core/config.py      # Settings (pydantic-settings)
│   │   ├── db.py               # SQLAlchemy async engine
│   │   ├── main.py             # App factory, middleware, lifespan
│   │   └── schemas.py          # Pydantic models
│   ├── alembic/                # Database migrations
│   ├── pyproject.toml
│   └── requirements.txt
│
├── web/                        # Next.js dashboard
│   ├── app/
│   │   ├── page.tsx            # Main tracker page (server component)
│   │   ├── town/[slug]/        # Per-town page + OG image
│   │   └── sitemap.ts
│   ├── components/             # UI components
│   ├── lib/api.ts              # API client
│   └── public/
│
├── docs/                       # Nextra docs site
│   └── pages/
│       ├── endpoints/          # Endpoint reference pages
│       ├── examples/           # curl / JS / Python examples
│       └── reference/          # Data types, errors
│
├── pnpm-workspace.yaml
└── package.json
```

---

## API overview

Base URL: `https://api.fuelkenya.com/v1`

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/health` | Health check |
| `GET` | `/v1/towns` | All towns with price data |
| `GET` | `/v1/prices` | Price history (filterable by town, date range) |
| `GET` | `/v1/prices/latest` | Latest cycle prices (all towns or one town) |
| `POST` | `/v1/ingest/csv` | Upload new EPRA pricing CSV (admin, bearer token) |

Full documentation: [docs.fuelkenya.com](https://docs.fuelkenya.com)

---

## Development workflow

### Running both web and API together

```bash
# Terminal 1
cd api && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2
cd web && pnpm dev
```

### Adding a database migration

```bash
cd api
source .venv/bin/activate
alembic revision --autogenerate -m "description of change"
alembic upgrade head
```

### Building for production

```bash
# Web
cd web && pnpm build

# Docs (static export)
cd docs && pnpm build
# Output in docs/out/ — deploy to any static host
```

---

## Ingesting EPRA data

Download the latest price schedule CSV from [epra.go.ke](https://www.epra.go.ke) and upload it:

```bash
curl -X POST https://api.fuelkenya.com/v1/ingest/csv \
  -H "Authorization: Bearer $INGEST_TOKEN" \
  -F "file=@epra_july_2026.csv"
```

The endpoint accepts various column name formats (see [ingest docs](https://docs.fuelkenya.com/endpoints/ingest-csv)).

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

[MIT](./LICENSE) — © 2026 Eric Kariuki
