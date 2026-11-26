"""Price-alert signups and the list of pricing cycles (for /epra-review pages)."""

import asyncio
import logging
import re
from datetime import date, datetime, timezone
from typing import List, Literal, Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints import verify_ingest_token
from app.core import alert_email
from app.core.config import Settings, get_settings
from app.db import alert_sends, alert_subscribers, engine, fuel_prices, get_db

logger = logging.getLogger("fuelkenya.alerts")

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
        await conn.run_sync(alert_sends.create, checkfirst=True)
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


# ---------------------------------------------------------------------------
# Monthly alert email
# ---------------------------------------------------------------------------


class SendIn(BaseModel):
    # dry_run: count recipients and show the subject, send nothing.
    # test: send this cycle's email to test_email only (repeatable).
    # send: email every active subscriber, once per cycle.
    # auto: like send, run by upload_cycles.sh. Skips quietly unless the upload
    #   included the newest cycle, that cycle is recent, and it hasn't been sent.
    mode: Literal["dry_run", "test", "send", "auto"] = "dry_run"
    test_email: Optional[str] = None
    uploaded: List[date] = Field(default_factory=list)


AUTO_MAX_AGE_DAYS = 7


def auto_skip_reason(latest_from: date, uploaded: List[date], today: date) -> Optional[str]:
    """Why an automatic send should not go out, or None if it should."""
    if latest_from not in uploaded:
        return "this upload did not include the newest cycle"
    if (today - latest_from).days > AUTO_MAX_AGE_DAYS:
        return f"the newest cycle started more than {AUTO_MAX_AGE_DAYS} days ago"
    return None


class SendOut(BaseModel):
    mode: str
    valid_from: date
    recipients: int
    sent: int
    subject_example: Optional[str] = None
    skipped: Optional[str] = None


async def _cycle_rows(db: AsyncSession, valid_from: date):
    result = await db.execute(select(fuel_prices).where(fuel_prices.c.valid_from == valid_from))
    rows = {}
    for r in result:
        m = dict(r._mapping)
        rows[m["town"].lower()] = {
            "town": m["town"],
            "super_petrol": float(m["super_petrol"]),
            "diesel": float(m["diesel"]),
            "kerosene": float(m["kerosene"]),
            "valid_to": m["valid_to"],
        }
    return rows


@router.post(
    "/alerts/send",
    response_model=SendOut,
    tags=["alerts"],
    dependencies=[Depends(verify_ingest_token)],
)
async def send_alerts(
    payload: SendIn,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    await ensure_table()
    latest_from = await db.scalar(select(func.max(fuel_prices.c.valid_from)))
    if latest_from is None:
        raise HTTPException(status_code=404, detail="No prices loaded.")
    prev_from = await db.scalar(
        select(func.max(fuel_prices.c.valid_from)).where(fuel_prices.c.valid_from < latest_from)
    )
    latest = await _cycle_rows(db, latest_from)
    previous = await _cycle_rows(db, prev_from) if prev_from else {}
    valid_to = max(r["valid_to"] for r in latest.values())

    if payload.mode == "auto":
        reason = auto_skip_reason(latest_from, payload.uploaded, datetime.now(ZoneInfo("Africa/Nairobi")).date())
        if reason:
            return SendOut(mode="auto", valid_from=latest_from, recipients=0, sent=0, skipped=reason)

    if payload.mode == "test":
        email = (payload.test_email or "").strip().lower()
        if not EMAIL_RE.match(email):
            raise HTTPException(status_code=422, detail="test_email must be a valid address.")
        recipients = [(email, None)]
    else:
        result = await db.execute(
            select(alert_subscribers.c.email, alert_subscribers.c.town).where(
                alert_subscribers.c.unsubscribed_at.is_(None)
            )
        )
        recipients = [(r.email, r.town) for r in result]

    messages = [
        alert_email.build_email(settings, e, t, latest, previous, latest_from, valid_to)
        for e, t in recipients
    ]
    example = messages[0]["subject"] if messages else None
    if payload.mode == "dry_run":
        return SendOut(mode="dry_run", valid_from=latest_from, recipients=len(messages), sent=0, subject_example=example)

    if not settings.resend_api_key:
        raise HTTPException(status_code=503, detail="RESEND_API_KEY is not configured.")

    claims = payload.mode in ("send", "auto")
    if claims:
        # Claim the cycle first so a double click or retry can't email everyone twice.
        try:
            await db.execute(pg_insert(alert_sends).values(valid_from=latest_from, recipients=0))
            await db.commit()
        except IntegrityError:
            await db.rollback()
            if payload.mode == "auto":
                return SendOut(mode="auto", valid_from=latest_from, recipients=0, sent=0,
                               skipped="alerts for this cycle were already sent")
            raise HTTPException(status_code=409, detail=f"Alerts for the {latest_from} cycle were already sent.")

    sent = 0
    try:
        for i in range(0, len(messages), alert_email.BATCH_SIZE):
            chunk = messages[i : i + alert_email.BATCH_SIZE]
            await asyncio.to_thread(alert_email.send_batch, settings, chunk)
            sent += len(chunk)
    except Exception:
        logger.exception("Alert send stopped after %s of %s", sent, len(messages))
        raise HTTPException(
            status_code=502,
            detail=f"Sending stopped after {sent} of {len(messages)} emails. Check the API logs.",
        )
    finally:
        if claims:
            await db.execute(
                update(alert_sends).where(alert_sends.c.valid_from == latest_from).values(recipients=sent)
            )
            await db.commit()

    return SendOut(mode=payload.mode, valid_from=latest_from, recipients=len(messages), sent=sent, subject_example=example)


UNSUB_PAGE = """<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FuelKenya alerts</title><body style="font-family:-apple-system,Segoe UI,sans-serif;max-width:480px;margin:15vh auto;padding:0 16px;color:#1c1917">
<h1 style="font-size:20px">{title}</h1><p>{body}</p><p><a href="https://fuelkenya.com" style="color:#047857">Back to FuelKenya</a></p></body>"""


async def _unsubscribe(db: AsyncSession, settings: Settings, email: str, sig: str) -> bool:
    email = (email or "").strip().lower()
    if not alert_email.verify_unsubscribe(settings, email, sig):
        return False
    await ensure_table()
    await db.execute(
        update(alert_subscribers)
        .where(alert_subscribers.c.email == email, alert_subscribers.c.unsubscribed_at.is_(None))
        .values(unsubscribed_at=datetime.now(timezone.utc))
    )
    await db.commit()
    return True


@router.get("/alerts/unsubscribe", response_class=HTMLResponse, tags=["alerts"], include_in_schema=False)
async def unsubscribe_page(
    email: str = Query(""),
    sig: str = Query(""),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    if await _unsubscribe(db, settings, email, sig):
        return HTMLResponse(UNSUB_PAGE.format(title="You're unsubscribed", body="You won't get any more price alerts. You can sign up again on fuelkenya.com any time."))
    return HTMLResponse(UNSUB_PAGE.format(title="Link not recognised", body="This unsubscribe link is incomplete. Use the link in your most recent email."), status_code=400)


@router.post("/alerts/unsubscribe", tags=["alerts"], include_in_schema=False)
async def unsubscribe_one_click(
    email: str = Query(""),
    sig: str = Query(""),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    """RFC 8058 one-click unsubscribe (Gmail/Yahoo "Unsubscribe" button)."""
    if not await _unsubscribe(db, settings, email, sig):
        raise HTTPException(status_code=400, detail="Invalid unsubscribe link.")
    return {"status": "unsubscribed"}
