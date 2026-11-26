"""Price-alert signups and the list of pricing cycles (for /epra-review pages)."""

import re
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import alert_subscribers, engine, fuel_prices, get_db

router = APIRouter()

# Deliberately simple: one @, a dot in the domain, no spaces. Real validation
# happens when the first alert email is delivered.
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

_table_ready = False


async def ensure_table() -> None:
    """Create alert_subscribers on first use (prod has no migration step)."""
    global _table_ready
    if _table_ready:
        return
    async with engine.begin() as conn:
        await conn.run_sync(alert_subscribers.create, checkfirst=True)
    _table_ready = True


class SubscribeIn(BaseModel):
    email: str = Field(..., max_length=254)
    town: Optional[str] = Field(None, max_length=100)
    source: Optional[str] = Field(None, max_length=50)
    # Honeypot: real users never see this field, bots fill it in.
    website: Optional[str] = None


class SubscribeOut(BaseModel):
    status: str


@router.post(
    "/alerts/subscribe",
    response_model=SubscribeOut,
    status_code=status.HTTP_200_OK,
    tags=["alerts"],
)
async def subscribe(payload: SubscribeIn, db: AsyncSession = Depends(get_db)):
    email = payload.email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")
    if payload.website:
        # Pretend success so bots don't learn anything.
        return SubscribeOut(status="subscribed")

    await ensure_table()
    town = (payload.town or "").strip() or None
    stmt = pg_insert(alert_subscribers).values(
        email=email, town=town, source=(payload.source or "").strip() or None
    )
    # Signing up again re-activates an address and updates its town, without
    # revealing whether it was already on the list.
    stmt = stmt.on_conflict_do_update(
        index_elements=[alert_subscribers.c.email],
        set_={"town": func.coalesce(stmt.excluded.town, alert_subscribers.c.town),
              "unsubscribed_at": None},
    )
    await db.execute(stmt)
    await db.commit()
    return SubscribeOut(status="subscribed")


class CycleOut(BaseModel):
    valid_from: date
    valid_to: date
    towns: int


@router.get("/cycles", response_model=List[CycleOut], tags=["prices"])
async def list_cycles(response: Response, db: AsyncSession = Depends(get_db)):
    """Every pricing cycle on record, newest first, with how many towns it covers."""
    response.headers["Cache-Control"] = (
        "public, max-age=300, s-maxage=600, stale-while-revalidate=3600"
    )
    stmt = (
        select(
            fuel_prices.c.valid_from,
            func.max(fuel_prices.c.valid_to).label("valid_to"),
            func.count().label("towns"),
        )
        .group_by(fuel_prices.c.valid_from)
        .order_by(fuel_prices.c.valid_from.desc())
    )
    result = await db.execute(stmt)
    return [CycleOut(**dict(r._mapping)) for r in result]
