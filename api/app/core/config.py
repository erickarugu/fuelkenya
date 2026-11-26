from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "FuelKenya API"
    app_version: str = "0.1.0"
    api_prefix: str = "/v1"
    docs_url: str = "/docs"
    redoc_url: str = "/redoc"
    database_url: str = "postgresql+asyncpg://postgres:admin@localhost:5432/fuel_kenya"
    ingest_token: str = ""
    # After a successful ingest the API POSTs here (Bearer ingest_token) so the
    # website drops its cached prices immediately. Empty disables it.
    web_revalidate_url: str = "https://fuelkenya.com/api/revalidate"
    # Shared secret sent by our own servers in X-FuelKenya-Client-Token to
    # skip the per-IP rate limit. Empty means no client is trusted.
    trusted_client_token: str = ""
    # Monthly price-alert emails (Resend). Empty RESEND_API_KEY disables sending.
    resend_api_key: str = ""
    alerts_from: str = "FuelKenya <alerts@fuelkenya.com>"
    alerts_reply_to: str = ""
    # Signs unsubscribe links. Falls back to ingest_token when unset.
    alerts_secret: str = ""
    public_api_url: str = "https://api.fuelkenya.com/v1"
    site_url: str = "https://fuelkenya.com"
    rate_limit_max_requests: int = 60
    rate_limit_window_seconds: int = 60
    rate_limit_exempt_paths: list[str] = ["/v1/health"]
    sql_echo: bool = True
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
