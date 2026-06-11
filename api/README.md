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
