import csv
import re
from datetime import datetime, date
from decimal import Decimal
from io import TextIOWrapper
from typing import Dict, List, Optional, Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    Header,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import clear_latest_cache, get_latest_cache, set_latest_cache
from app.core.config import get_settings, Settings
from app.db import build_upsert_statement, fuel_prices, get_db
from app.schemas import FuelPriceOut, IngestResponse

router = APIRouter()
CACHE_CONTROL = "public, max-age=86400, s-maxage=604800"

EXPECTED_COLUMNS = {
    "valid_from",
    "valid_to",
    "town",
    "super_petrol",
    "diesel",
    "kerosene",
}

COLUMN_ALIASES = {
    "from": "valid_from",
    "to": "valid_to",
    "town": "town",
    "superpms": "super_petrol",
    "dieselago": "diesel",
    "keroseneik": "kerosene",
}


def normalize_header_key(raw: str) -> Optional[str]:
    cleaned = re.sub(r"[^0-9a-zA-Z]", "", raw or "").strip().lower()
    return COLUMN_ALIASES.get(cleaned)


def parse_date(raw_value: str) -> date:
    value = raw_value.strip()
    for fmt in ("%d-%m-%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Invalid date format: {raw_value}")


def parse_decimal(raw_value: str) -> Decimal:
    clean_value = raw_value.strip().replace(",", ".")
    return Decimal(clean_value)


def normalize_town(raw_value: str) -> str:
    return raw_value.strip().title()


def build_record(row: Dict[str, str]) -> Dict[str, object]:
    return {
        "town": normalize_town(row["town"]),
        "super_petrol": parse_decimal(row["super_petrol"]),
        "diesel": parse_decimal(row["diesel"]),
        "kerosene": parse_decimal(row["kerosene"]),
        "valid_from": parse_date(row["valid_from"]),
        "valid_to": parse_date(row["valid_to"]),
    }


def map_csv_rows(reader: csv.DictReader) -> List[Dict[str, str]]:
    header_map: Dict[str, str] = {}
    for original_key in reader.fieldnames or []:
        canonical = normalize_header_key(original_key)
        if canonical:
            header_map[original_key] = canonical

    if set(header_map.values()) != EXPECTED_COLUMNS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV header must include From, To, Town, Super (PMS), Diesel (AGO), Kerosene (IK)",
        )

    rows: List[Dict[str, str]] = []
    for raw_row in reader:
        mapped_row = {
            header_map[key]: value
            for key, value in raw_row.items()
            if key in header_map
        }
        rows.append(mapped_row)

    return rows


def response_cache_control(response: Response) -> None:
    response.headers["Cache-Control"] = CACHE_CONTROL


async def verify_ingest_token(
    authorization: Optional[str] = Header(None),
    settings: Settings = Depends(get_settings),
) -> None:
    if not settings.ingest_token:
        return

    expected = f"Bearer {settings.ingest_token}"
    if authorization != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization token for ingestion endpoint.",
        )


def transform_row(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "town": row["town"],
        "super_petrol": float(row["super_petrol"]),
        "diesel": float(row["diesel"]),
        "kerosene": float(row["kerosene"]),
        "valid_from": row["valid_from"].isoformat(),
        "valid_to": row["valid_to"].isoformat(),
    }


@router.get("/health", tags=["health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "healthy"}
    except Exception:
        raise HTTPException(status_code=500, detail="Database unreachable")


@router.post(
    "/ingest/csv",
    status_code=status.HTTP_201_CREATED,
    response_model=IngestResponse,
    tags=["ingest"],
)
async def ingest_csv(
    response: Response,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _auth: None = Depends(verify_ingest_token),
):
    response_cache_control(response)
    if file.content_type not in {
        "text/csv",
        "application/vnd.ms-excel",
        "application/octet-stream",
    }:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Uploaded file must be a CSV file.",
        )

    wrapper = TextIOWrapper(file.file, encoding="utf-8", newline="")
    reader = csv.DictReader(wrapper)
    rows = map_csv_rows(reader)

    try:
        records = [build_record(row) for row in rows]
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc

    if not records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV payload contains no rows.",
        )

    stmt = build_upsert_statement(records)
    await db.execute(stmt)
    await db.commit()
    clear_latest_cache()

    return IngestResponse(
        status="success",
        records_processed=len(records),
        timestamp=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    )


@router.get(
    "/prices",
    response_model=List[FuelPriceOut],
    status_code=status.HTTP_200_OK,
    tags=["prices"],
)
async def list_prices(
    response: Response,
    town: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    response_cache_control(response)

    query = select(fuel_prices)
    if town:
        query = query.where(func.lower(fuel_prices.c.town) == town.strip().lower())
    if start_date:
        query = query.where(fuel_prices.c.valid_from >= start_date)
    if end_date:
        query = query.where(fuel_prices.c.valid_to <= end_date)

    query = query.order_by(fuel_prices.c.valid_from.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    rows = [transform_row(dict(row._mapping)) for row in result]
    return rows


@router.get(
    "/prices/latest",
    response_model=List[FuelPriceOut],
    status_code=status.HTTP_200_OK,
    tags=["prices"],
)
async def latest_prices(
    response: Response,
    town: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    response_cache_control(response)

    latest_date = await db.scalar(select(func.max(fuel_prices.c.valid_from)))
    if latest_date is None:
        return []

    cache = get_latest_cache()
    if cache["valid_from"] == latest_date:
        rows = cache["rows"]
        if town:
            rows = [row for row in rows if row["town"].lower() == town.strip().lower()]
        return rows

    query = select(fuel_prices).where(fuel_prices.c.valid_from == latest_date)
    if town:
        query = query.where(func.lower(fuel_prices.c.town) == town.strip().lower())

    result = await db.execute(query)
    rows = [transform_row(dict(row._mapping)) for row in result]

    if town is None:
        set_latest_cache(latest_date, rows)
    return rows


@router.get(
    "/towns",
    response_model=List[str],
    status_code=status.HTTP_200_OK,
    tags=["metadata"],
)
async def list_towns(response: Response, db: AsyncSession = Depends(get_db)):
    response_cache_control(response)
    # PostgreSQL requires ORDER BY expressions to appear in the SELECT list when
    # using DISTINCT. To avoid that limitation while preserving case-insensitive
    # ordering, group by the lower-case town key and select a representative
    # town value (the minimum by lexical order). This returns one town per
    # case-insensitive group ordered by the lower-case town name.
    stmt = (
        select(func.min(fuel_prices.c.town).label("town"))
        .group_by(func.lower(fuel_prices.c.town))
        .order_by(func.lower(func.min(fuel_prices.c.town)))
    )
    result = await db.execute(stmt)
    # use `scalars()` to return a list of plain town strings instead of tuples
    return result.scalars().all()
