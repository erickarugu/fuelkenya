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
