from fastapi import FastAPI

from app.api.v1.endpoints import router as v1_router
from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url=settings.docs_url,
        redoc_url=settings.redoc_url,
    )
    app.include_router(v1_router, prefix=settings.api_prefix)
    return app


app = create_app()
