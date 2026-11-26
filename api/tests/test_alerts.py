from fastapi.testclient import TestClient

from app.api.v1 import alerts
from app.db import get_db


class FakeSession:
    def __init__(self):
        self.executed = []

    async def execute(self, stmt):
        self.executed.append(stmt)

    async def commit(self):
        pass


def make_client(monkeypatch):
    from fastapi import FastAPI

    session = FakeSession()

    async def fake_db():
        yield session

    async def ready():
        return None

    monkeypatch.setattr(alerts, "ensure_table", ready)
    app = FastAPI()
    app.include_router(alerts.router, prefix="/v1")
    app.dependency_overrides[get_db] = fake_db
    return TestClient(app), session


def test_subscribe_stores_lowercased_email(monkeypatch):
    client, session = make_client(monkeypatch)
    res = client.post("/v1/alerts/subscribe", json={"email": " Jane@Example.COM ", "town": "Kisumu"})
    assert res.status_code == 200
    assert res.json() == {"status": "subscribed"}
    params = session.executed[0].compile().params
    assert params["email"] == "jane@example.com"
    assert params["town"] == "Kisumu"


def test_subscribe_rejects_bad_email(monkeypatch):
    client, session = make_client(monkeypatch)
    res = client.post("/v1/alerts/subscribe", json={"email": "not-an-email"})
    assert res.status_code == 422
    assert session.executed == []


def test_honeypot_is_silently_ignored(monkeypatch):
    client, session = make_client(monkeypatch)
    res = client.post("/v1/alerts/subscribe", json={"email": "bot@spam.com", "website": "x"})
    assert res.status_code == 200
    assert session.executed == []


from datetime import date

from app.core import alert_email
from app.core.config import Settings


def _settings():
    return Settings(ingest_token="secret-token", resend_api_key="re_test")


def _row(town, p, d, k):
    return {"town": town, "super_petrol": p, "diesel": d, "kerosene": k}


def test_unsubscribe_signature_round_trip():
    s = _settings()
    sig = alert_email.unsubscribe_sig(s, "Jane@example.com")
    assert alert_email.verify_unsubscribe(s, "jane@example.com", sig)
    assert not alert_email.verify_unsubscribe(s, "other@example.com", sig)
    assert not alert_email.verify_unsubscribe(s, "jane@example.com", "")


def test_unsubscribe_disabled_without_secret():
    s = Settings(ingest_token="", alerts_secret="")
    assert not alert_email.verify_unsubscribe(s, "a@b.co", alert_email.unsubscribe_sig(s, "a@b.co"))


def test_email_leads_with_subscribers_town_and_shows_change():
    s = _settings()
    latest = {
        "nairobi": _row("Nairobi", 226.96, 227.76, 219.87),
        "kisumu": _row("Kisumu", 226.51, 227.31, 219.43),
    }
    previous = {
        "nairobi": _row("Nairobi", 226.96, 227.76, 219.87),
        "kisumu": _row("Kisumu", 228.01, 227.31, 219.43),
    }
    msg = alert_email.build_email(
        s, "jane@example.com", "kisumu", latest, previous, date(2026, 11, 15), date(2026, 12, 14),
        today=date(2026, 11, 14),
    )
    assert msg["to"] == ["jane@example.com"]
    assert msg["subject"] == "⛽ Petrol drops KSh 1.50 in Kisumu at midnight"
    assert "fill up after midnight" in msg["html"]
    assert msg["html"].index("Kisumu") < msg["html"].index("Nairobi")
    assert "/epra-review/2026-11" in msg["text"]
    assert "List-Unsubscribe" in msg["headers"]
    assert "sig=" in msg["headers"]["List-Unsubscribe"]


def test_email_escapes_town_names():
    s = _settings()
    latest = {"<b>x": _row("<b>x", 1, 1, 1)}
    msg = alert_email.build_email(s, "a@b.co", "<b>x", latest, {}, date(2026, 11, 15), date(2026, 12, 14))
    assert "<b>x" not in msg["html"]


def test_price_rise_before_start_urges_filling_up():
    s = _settings()
    latest = {"nairobi": _row("Nairobi", 230.00, 228, 220)}
    previous = {"nairobi": _row("Nairobi", 226.96, 228, 220)}
    msg = alert_email.build_email(
        s, "a@b.co", None, latest, previous, date(2026, 12, 15), date(2027, 1, 14), today=date(2026, 12, 14)
    )
    assert msg["subject"] == "⛽ Petrol goes up KSh 3.04 in Nairobi at midnight. Fill up today"


def test_unchanged_after_start():
    s = _settings()
    row = _row("Nairobi", 226.96, 227.76, 219.87)
    msg = alert_email.build_email(
        s, "a@b.co", None, {"nairobi": row}, {"nairobi": row}, date(2026, 11, 15), date(2026, 12, 14),
        today=date(2026, 11, 26),
    )
    assert msg["subject"] == "⛽ No change: Nairobi fuel prices hold for another month"
    assert "now in effect" in msg["html"]


def _subject(petrol, diesel, prev_petrol, prev_diesel, today=date(2026, 12, 14)):
    latest = {"nairobi": _row("Nairobi", petrol, diesel, 200)}
    previous = {"nairobi": _row("Nairobi", prev_petrol, prev_diesel, 200)}
    return alert_email.build_email(
        _settings(), "a@b.co", None, latest, previous, date(2026, 12, 15), date(2027, 1, 14), today=today
    )["subject"]


def test_subject_includes_diesel():
    assert _subject(230, 220, 227, 218) == (
        "⛽ Petrol up KSh 3.00, diesel up KSh 2.00 in Nairobi at midnight. Fill up today"
    )
    assert _subject(225, 216, 227, 218) == "⛽ Petrol down KSh 2.00, diesel down KSh 2.00 in Nairobi at midnight"
    assert _subject(230, 216, 227, 218) == (
        "⛽ Petrol up KSh 3.00, diesel down KSh 2.00 in Nairobi at midnight. Fill up today"
    )
    assert _subject(227, 220, 227, 218) == "⛽ Diesel goes up KSh 2.00 in Nairobi at midnight. Fill up today"
