from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.rate_limit import TRUSTED_CLIENT_HEADER, RateLimitMiddleware


def make_client(monkeypatch, max_requests=3, trusted_token=""):
    monkeypatch.setenv("RATE_LIMIT_MAX_REQUESTS", str(max_requests))
    monkeypatch.setenv("RATE_LIMIT_WINDOW_SECONDS", "60")
    monkeypatch.setenv("TRUSTED_CLIENT_TOKEN", trusted_token)
    get_settings.cache_clear()

    app = FastAPI()
    app.add_middleware(RateLimitMiddleware)

    @app.get("/v1/towns")
    async def towns():
        return ["Nairobi"]

    @app.get("/v1/health")
    async def health():
        return {"status": "healthy"}

    return TestClient(app)


def test_over_limit_returns_429_not_500(monkeypatch):
    client = make_client(monkeypatch, max_requests=3)

    codes = [client.get("/v1/towns").status_code for _ in range(5)]

    assert codes == [200, 200, 200, 429, 429]


def test_429_has_retry_after_and_detail(monkeypatch):
    client = make_client(monkeypatch, max_requests=1)
    client.get("/v1/towns")

    res = client.get("/v1/towns")

    assert res.status_code == 429
    assert res.json() == {"detail": "Rate limit exceeded. Try again later."}
    assert 1 <= int(res.headers["Retry-After"]) <= 60
    assert res.headers["X-RateLimit-Remaining"] == "0"


def test_success_reports_remaining(monkeypatch):
    client = make_client(monkeypatch, max_requests=3)

    first = client.get("/v1/towns")

    assert first.headers["X-RateLimit-Limit"] == "3"
    assert first.headers["X-RateLimit-Remaining"] == "2"


def test_limit_is_per_client_ip(monkeypatch):
    client = make_client(monkeypatch, max_requests=1)

    a = client.get("/v1/towns", headers={"x-forwarded-for": "41.90.0.1"})
    b = client.get("/v1/towns", headers={"x-forwarded-for": "41.90.0.2"})
    a_again = client.get("/v1/towns", headers={"x-forwarded-for": "41.90.0.1"})

    assert (a.status_code, b.status_code, a_again.status_code) == (200, 200, 429)


def test_health_is_exempt(monkeypatch):
    client = make_client(monkeypatch, max_requests=1)

    codes = [client.get("/v1/health").status_code for _ in range(3)]

    assert codes == [200, 200, 200]


def test_trusted_client_token_skips_limit(monkeypatch):
    client = make_client(monkeypatch, max_requests=1, trusted_token="s3cret")
    headers = {TRUSTED_CLIENT_HEADER: "s3cret"}

    codes = [client.get("/v1/towns", headers=headers).status_code for _ in range(5)]

    assert codes == [200] * 5


def test_wrong_token_is_still_limited(monkeypatch):
    client = make_client(monkeypatch, max_requests=1, trusted_token="s3cret")
    headers = {TRUSTED_CLIENT_HEADER: "guess"}

    codes = [client.get("/v1/towns", headers=headers).status_code for _ in range(2)]

    assert codes == [200, 429]


def test_empty_token_config_trusts_nobody(monkeypatch):
    client = make_client(monkeypatch, max_requests=1, trusted_token="")
    headers = {TRUSTED_CLIENT_HEADER: ""}

    codes = [client.get("/v1/towns", headers=headers).status_code for _ in range(2)]

    assert codes == [200, 429]
