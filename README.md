# fuelkenya

Monorepo skeleton for FuelKenya.

- `api/` — FastAPI backend
- `web/` — future frontend space

## Backend

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API endpoints start at `/api/v1`.
