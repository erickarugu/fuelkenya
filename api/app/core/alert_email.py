"""Build and send the monthly "new fuel prices" email."""
from __future__ import annotations

import hashlib
import hmac
import html
import json
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime
from zoneinfo import ZoneInfo
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


def slugify(town: str) -> str:
    return town.lower().replace(" ", "-")


# Site palette (fuelkenya.com dark theme).
BG = "#080808"
CARD = "#111111"
BORDER = "#222222"
TEXT = "#fafaf9"
MUTED = "#a8a29e"
FAINT = "#78716c"
GREEN = "#34d399"
RED = "#f87171"
SANS = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
DISPLAY = "'Space Grotesk',Inter,-apple-system,'Segoe UI',sans-serif"
MONO = "'JetBrains Mono',SFMono-Regular,Menlo,Consolas,monospace"


def _delta(now: float, before: Optional[float]) -> Optional[float]:
    return None if before is None else round(now - before, 2)


def _pill(d: Optional[float]) -> str:
    if d is None:
        return ""
    if d == 0:
        color, label = FAINT, "No change"
    elif d > 0:
        color, label = RED, f"▲ KSh {d:.2f}"
    else:
        color, label = GREEN, f"▼ KSh {abs(d):.2f}"
    return (
        f'<span style="display:inline-block;padding:3px 10px;border-radius:999px;'
        f'border:1px solid {color};color:{color};font:600 12px {SANS}">{label}</span>'
    )


def _move(fuel: str, d: float) -> str:
    return f"{fuel} {'up' if d > 0 else 'down'} KSh {abs(d):.2f}"


def _headline(
    town: str, d_petrol: Optional[float], d_diesel: Optional[float], starts: str, upcoming: bool
) -> Dict[str, str]:
    """Subject, headline and nudge, worded from the petrol and diesel changes."""
    when = "at midnight" if upcoming else f"from {starts}"
    if d_petrol is None and d_diesel is None:
        return {
            "subject": f"⛽ New EPRA fuel prices are out for {town}",
            "headline": f"New fuel prices for {town}",
            "nudge": f"The new maximum pump prices apply {when}.",
        }
    moves = [(f, d) for f, d in (("Petrol", d_petrol), ("Diesel", d_diesel)) if d]
    if not moves:
        return {
            "subject": f"⛽ No change: {town} fuel prices hold for another month",
            "headline": "Prices hold for another month",
            "nudge": "EPRA kept pump prices where they were. Nothing to rush for.",
        }
    rising = any(d > 0 for _, d in moves)
    if len(moves) == 1:
        f, d = moves[0]
        verb = "goes up" if d > 0 else "drops"
        phrase = f"{f} {verb} KSh {abs(d):.2f}"
    elif moves[0][1] * moves[1][1] > 0:
        dir_ = "up" if rising else "down"
        phrase = f"Petrol {dir_} KSh {abs(moves[0][1]):.2f}, diesel {dir_} KSh {abs(moves[1][1]):.2f}"
    else:
        phrase = f"{_move('Petrol', moves[0][1])}, {_move('diesel', moves[1][1])}"
    subject = f"⛽ {phrase} in {town} {when}" + (". Fill up today" if rising and upcoming else "")
    if rising:
        headline = phrase if len(moves) > 1 else f"{phrase} {when}"
        nudge = ("Fill up before midnight to pay today's price." if upcoming
                 else "Prices have gone up. Budget for it on your next fill-up.")
    else:
        headline = f"Good news: {phrase[0].lower() + phrase[1:]}"
        nudge = ("If you can wait, fill up after midnight." if upcoming
                 else "Cheaper fuel is here. Make sure your station passes it on.")
    return {"subject": subject, "headline": headline, "nudge": nudge}


def build_email(
    settings: Settings,
    email: str,
    town: Optional[str],
    latest: Dict[str, Dict[str, Any]],
    previous: Dict[str, Dict[str, Any]],
    valid_from: date,
    valid_to: date,
    today: Optional[date] = None,
) -> Dict[str, Any]:
    """One personalised email. latest/previous map lower-cased town -> row."""
    # Nairobi time: the server runs on UTC, and "midnight" means Kenyan midnight.
    today = today or datetime.now(ZoneInfo("Africa/Nairobi")).date()
    towns: List[str] = []
    if town and town.lower() in latest:
        towns.append(latest[town.lower()]["town"])
    for t in KEY_TOWNS:
        if t.lower() in latest and t not in towns:
            towns.append(t)
    if not towns and latest:
        towns.append(next(iter(latest.values()))["town"])

    lead_name = towns[0] if towns else "Kenya"
    lead = latest.get(lead_name.lower())
    lead_prev = previous.get(lead_name.lower())
    month = valid_from.strftime("%B %Y")
    starts = _fmt_date(valid_from)
    upcoming = today < valid_from
    review_url = f"{settings.site_url}/epra-review/{valid_from.strftime('%Y-%m')}"
    town_url = f"{settings.site_url}/town/{urllib.parse.quote(slugify(lead_name))}"
    unsub = unsubscribe_url(settings, email)
    e = html.escape

    d_petrol = _delta(lead["super_petrol"], lead_prev and lead_prev["super_petrol"]) if lead else None
    d_diesel = _delta(lead["diesel"], lead_prev and lead_prev["diesel"]) if lead else None
    words = _headline(lead_name, d_petrol, d_diesel, starts, upcoming)

    # Three price cards for the subscriber's town.
    cards = []
    if lead:
        for name, key in (("Super Petrol", "super_petrol"), ("Diesel", "diesel"), ("Kerosene", "kerosene")):
            d = _delta(lead[key], lead_prev and lead_prev[key])
            cards.append(
                f'<td width="33%" valign="top" style="padding:0 4px">'
                f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
                f'style="background:{CARD};border:1px solid {BORDER};border-radius:14px">'
                f'<tr><td style="padding:16px 14px">'
                f'<div style="font:500 11px {SANS};letter-spacing:.12em;text-transform:uppercase;color:{FAINT}">{name}</div>'
                f'<div style="font:700 26px {MONO};color:{TEXT};padding:6px 0 8px">{lead[key]:.2f}</div>'
                f"{_pill(d)}</td></tr></table></td>"
            )

    rows = []
    for t in towns[1:]:
        r = latest[t.lower()]
        p = previous.get(t.lower())
        d = _delta(r["super_petrol"], p and p["super_petrol"])
        dc = FAINT if not d else (RED if d > 0 else GREEN)
        dl = "-" if d is None else ("0.00" if d == 0 else f"{'+' if d > 0 else '−'}{abs(d):.2f}")
        link = e(f"{settings.site_url}/town/{urllib.parse.quote(slugify(t))}")
        rows.append(
            f'<tr><td style="padding:11px 0;border-top:1px solid {BORDER};font:500 14px {SANS}">'
            f'<a href="{link}" style="color:{TEXT};text-decoration:none">{e(t)}</a></td>'
            f'<td align="right" style="padding:11px 0;border-top:1px solid {BORDER};font:500 14px {MONO};color:{TEXT}">{r["super_petrol"]:.2f}</td>'
            f'<td align="right" style="padding:11px 0;border-top:1px solid {BORDER};font:500 14px {MONO};color:{TEXT}">{r["diesel"]:.2f}</td>'
            f'<td align="right" style="padding:11px 0 11px 12px;border-top:1px solid {BORDER};font:500 13px {MONO};color:{dc}">{dl}</td></tr>'
        )
    others = (
        f'<tr><td style="padding:28px 28px 0">'
        f'<div style="font:600 11px {SANS};letter-spacing:.12em;text-transform:uppercase;color:{FAINT};padding-bottom:6px">Major towns · KSh per litre</div>'
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
        f'<tr><td style="font:500 11px {SANS};color:{FAINT};padding-bottom:6px">Town</td>'
        f'<td align="right" style="font:500 11px {SANS};color:{FAINT};padding-bottom:6px">Petrol</td>'
        f'<td align="right" style="font:500 11px {SANS};color:{FAINT};padding-bottom:6px">Diesel</td>'
        f'<td align="right" style="font:500 11px {SANS};color:{FAINT};padding:0 0 6px 12px">Change</td></tr>'
        + "".join(rows)
        + "</table></td></tr>"
        if rows
        else ""
    )

    preheader = f"{words['headline']}. {words['nudge']}"
    body_html = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<title>{e(words['headline'])}</title></head>
<body style="margin:0;padding:0;background:{BG}" bgcolor="{BG}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">{e(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="{BG}" style="background:{BG}">
<tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">

<tr><td style="padding:0 28px 24px">
<a href="{e(settings.site_url)}" style="text-decoration:none;font:700 20px {DISPLAY}"><span style="color:{GREEN}">Fuel</span><span style="color:{TEXT}">Kenya</span></a>
<span style="font:500 12px {SANS};color:{FAINT};padding-left:8px">EPRA review · {e(month)}</span>
</td></tr>

<tr><td style="padding:0 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"
style="background:{CARD};border:1px solid {BORDER};border-radius:20px">
<tr><td style="padding:28px 28px 8px">
<div style="font:600 11px {SANS};letter-spacing:.14em;text-transform:uppercase;color:{GREEN}">{e(lead_name)} · {"from midnight" if upcoming else "now in effect"}</div>
<h1 style="margin:10px 0 8px;font:700 30px/1.15 {DISPLAY};color:{TEXT};letter-spacing:-.5px">{e(words['headline'])}</h1>
<p style="margin:0;font:400 15px/1.6 {SANS};color:{MUTED}">{e(words['nudge'])} New maximum pump prices run {e(starts)} to {e(_fmt_date(valid_to))}.</p>
</td></tr>
<tr><td style="padding:20px 24px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>{"".join(cards)}</tr></table></td></tr>
{others}
<tr><td align="center" style="padding:28px 28px 30px">
<a href="{e(review_url)}" style="display:inline-block;background:{GREEN};color:#052e1f;font:700 15px {SANS};text-decoration:none;padding:13px 26px;border-radius:999px">See every town &rarr;</a>
<div style="padding-top:14px"><a href="{e(town_url)}" style="font:500 13px {SANS};color:{MUTED};text-decoration:underline">{e(lead_name)} price history and trip cost</a></div>
</td></tr>
</table></td></tr>

<tr><td style="padding:24px 28px 0;font:400 12px/1.6 {SANS};color:{FAINT}">
Official EPRA maximum retail prices, VAT inclusive. Next review on the 14th, and we'll email you the moment it lands.<br>
You signed up at fuelkenya.com · <a href="{e(unsub)}" style="color:{FAINT};text-decoration:underline">Unsubscribe</a>
</td></tr>
</table></td></tr></table></body></html>"""

    lines = []
    for t in towns:
        r = latest[t.lower()]
        lines.append(f"{t}: petrol {r['super_petrol']:.2f}, diesel {r['diesel']:.2f}, kerosene {r['kerosene']:.2f}")
    body_text = (
        f"{words['headline']}\n{words['nudge']}\n"
        f"New maximum pump prices run {starts} to {_fmt_date(valid_to)} (KSh per litre):\n\n"
        + "\n".join(lines)
        + f"\n\nEvery town: {review_url}\n\nUnsubscribe: {unsub}\n"
    )
    msg: Dict[str, Any] = {
        "from": settings.alerts_from,
        "to": [email],
        "subject": words["subject"],
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
            # Resend's firewall rejects Python's default "Python-urllib" agent (403).
            "User-Agent": "fuelkenya-api/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as res:  # noqa: S310 (fixed https URL)
            if res.status >= 300:
                raise RuntimeError(f"Resend returned {res.status}")
    except urllib.error.HTTPError as err:
        detail = err.read()[:500].decode(errors="replace")
        raise RuntimeError(f"Resend returned {err.code}: {detail}") from err
