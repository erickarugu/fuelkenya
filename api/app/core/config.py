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
