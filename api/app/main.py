import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.endpoints import router as v1_router
from app.core.cache import clear_latest_cache
from app.core.config import Settings, get_settings
from app.core.rate_limit import RateLimitMiddleware
from app.db import init_db

logger = logging.getLogger("fuelkenya.requests")


def configure_logging(settings: Settings) -> None:
    level = getattr(logging, settings.log_level.upper(), logging.INFO)
    if not logging.root.handlers:
        logging.basicConfig(
            level=level,
            format="%(asctime)s %(levelname)s %(name)s %(message)s",
        )

    logging.getLogger("fuelkenya").setLevel(level)
    logging.getLogger("fuelkenya.requests").setLevel(level)
    logging.getLogger("fuelkenya.sql").setLevel(level)


class RequestTimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.monotonic()
        response = None
        try:
            response = await call_next(request)
            return response
        finally:
            elapsed_ms = (time.monotonic() - start) * 1000
            status_code = response.status_code if response is not None else "error"
            logger.info(
                "%s %s status=%s completed_in=%.2fms",
                request.method,
                request.url.path,
                status_code,
                elapsed_ms,
            )


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        clear_latest_cache()
        await init_db()
        yield

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url=settings.docs_url,
        redoc_url=settings.redoc_url,
        lifespan=lifespan,
    )

    origins = [
        "https://fuelkenya.com",
        "https://www.fuelkenya.com",
        "http://localhost:3000",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    app.add_middleware(RequestTimingMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.include_router(v1_router, prefix=settings.api_prefix)

    return app


app = create_app()
