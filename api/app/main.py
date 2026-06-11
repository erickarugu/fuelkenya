from fastapi import FastAPI

from app.api.v1.endpoints import router as v1_router
from app.core.config import get_settings
from app.core.rate_limit import RateLimitMiddleware
from app.db import init_db


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url=settings.docs_url,
        redoc_url=settings.redoc_url,
    )
    app.add_middleware(RateLimitMiddleware)
    app.include_router(v1_router, prefix=settings.api_prefix)

    @app.on_event("startup")
    async def on_startup() -> None:
        await init_db()

    return app


app = create_app()
