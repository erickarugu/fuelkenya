from fastapi import APIRouter, Depends

from app.core.config import get_settings, Settings

router = APIRouter()


@router.get("/health", tags=["health"])
async def health_check(settings: Settings = Depends(get_settings)):
    return {"status": "ok", "app": settings.app_name, "version": settings.app_version}


@router.get("/welcome", tags=["status"])
async def welcome(settings: Settings = Depends(get_settings)):
    return {
        "message": f"Welcome to {settings.app_name}",
        "api_prefix": settings.api_prefix,
    }
