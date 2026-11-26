"""Build and send the monthly "new fuel prices" email."""
from __future__ import annotations

import hashlib
import hmac
import html
import json
import urllib.parse
import urllib.request
from datetime import date
from typing import Any, Dict, List, Optional

from app.core.config import Settings

RESEND_BATCH_URL = "https://api.resend.com/emails/batch"
BATCH_SIZE = 100  # Resend's batch limit
KEY_TOWNS = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"]


def _secret(settings: Settings) -> bytes:
    return (settings.alerts_secret or settings.ingest_token).encode()


def unsubscribe_sig(settings: Settings, email: str) -> str:
    return hmac.new(_secret(settings), email.lower().encode(), hashlib.sha256).hexdigest()[:32]


def verify_unsubscribe(settings: Settings, email: str, sig: str) -> bool:
    if not _secret(settings):
        return False
    return hmac.compare_digest(unsubscribe_sig(settings, email), sig or "")


def unsubscribe_url(settings: Settings, email: str) -> str:
    q = urllib.parse.urlencode({"email": email, "sig": unsubscribe_sig(settings, email)})
    return f"{settings.public_api_url}/alerts/unsubscribe?{q}"


def _fmt_date(d: date) -> str:
    return f"{d.day} {d.strftime('%b %Y')}"


def _change(now: float, before: Optional[float]) -> str:
    if before is None:
        return ""
    delta = round(now - before, 2)
    if delta == 0:
        return "unchanged"
    return f"{'up' if delta > 0 else 'down'} KSh {abs(delta):.2f}"


def slugify(town: str) -> str:
    return town.lower().replace(" ", "-")


def build_email(
    settings: Settings,
    email: str,
    town: Optional[str],
    latest: Dict[str, Dict[str, Any]],
    previous: Dict[str, Dict[str, Any]],
    valid_from: date,
    valid_to: date,
) -> Dict[str, Any]:
    """One personalised email. latest/previous map lower-cased town -> row."""
    towns: List[str] = []
    if town and town.lower() in latest:
        towns.append(latest[town.lower()]["town"])
    for t in KEY_TOWNS:
        if t.lower() in latest and t not in towns:
            towns.append(t)
    lead = latest[towns[0].lower()] if towns else None
    lead_prev = previous.get(towns[0].lower()) if towns else None

    month = valid_from.strftime("%B %Y")
    review_url = f"{settings.site_url}/epra-review/{valid_from.strftime('%Y-%m')}"
    unsub = unsubscribe_url(settings, email)

    if lead:
        petrol_change = _change(lead["super_petrol"], lead_prev and lead_prev["super_petrol"])
        subject = (
            f"{lead['town']} petrol {petrol_change or 'now'} at KSh {lead['super_petrol']:.2f}: "
            f"EPRA prices {month}"
        )
    else:
        subject = f"New EPRA fuel prices for {month}"

    rows_html = []
    rows_text = []
    for t in towns:
        r = latest[t.lower()]
        p = previous.get(t.lower())
        cells = []
        for key in ("super_petrol", "diesel", "kerosene"):
            ch = _change(r[key], p and p[key])
            cells.append(
                f'<td style="padding:6px 10px;text-align:right;font-family:monospace">{r[key]:.2f}'
                f'<br><span style="color:#78716c;font-size:12px">{html.escape(ch)}</span></td>'
            )
        link = html.escape(f"{settings.site_url}/town/{urllib.parse.quote(slugify(t))}")
        rows_html.append(
            f'<tr><td style="padding:6px 10px"><a href="{link}" style="color:#047857">{html.escape(t)}</a></td>'
            + "".join(cells)
            + "</tr>"
        )
        rows_text.append(
            f"{t}: petrol {r['super_petrol']:.2f}, diesel {r['diesel']:.2f}, kerosene {r['kerosene']:.2f}"
        )

    period = f"{_fmt_date(valid_from)} to {_fmt_date(valid_to)}"
    body_html = f"""<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px;margin:auto;color:#1c1917">
<h1 style="font-size:20px">EPRA fuel prices, {html.escape(month)}</h1>
<p>New maximum pump prices apply from {html.escape(period)}. KSh per litre:</p>
<table style="border-collapse:collapse;width:100%;font-size:14px">
<tr style="color:#78716c;font-size:12px;text-align:right"><th style="text-align:left;padding:6px 10px">Town</th><th style="padding:6px 10px">Petrol</th><th style="padding:6px 10px">Diesel</th><th style="padding:6px 10px">Kerosene</th></tr>
{''.join(rows_html)}
</table>
<p><a href="{review_url}" style="color:#047857;font-weight:600">See every town and what changed</a></p>
<p style="color:#78716c;font-size:12px">Official EPRA maximum retail prices. You signed up at fuelkenya.com.
<a href="{html.escape(unsub)}" style="color:#78716c">Unsubscribe</a></p>
</div>"""
    body_text = (
        f"EPRA fuel prices, {month}\nNew maximum pump prices apply from {period} (KSh per litre):\n\n"
        + "\n".join(rows_text)
        + f"\n\nEvery town: {review_url}\n\nUnsubscribe: {unsub}\n"
    )
    msg: Dict[str, Any] = {
        "from": settings.alerts_from,
        "to": [email],
        "subject": subject,
        "html": body_html,
        "text": body_text,
        "headers": {
            "List-Unsubscribe": f"<{unsub}>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
    }
    if settings.alerts_reply_to:
        msg["reply_to"] = settings.alerts_reply_to
    return msg


def send_batch(settings: Settings, messages: List[Dict[str, Any]]) -> None:
    """POST up to BATCH_SIZE messages to Resend. Raises on failure."""
    req = urllib.request.Request(
        RESEND_BATCH_URL,
        data=json.dumps(messages).encode(),
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as res:  # noqa: S310 (fixed https URL)
        if res.status >= 300:
            raise RuntimeError(f"Resend returned {res.status}")
