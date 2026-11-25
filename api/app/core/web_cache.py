"""Tell the website to drop its cached prices after new data is ingested."""
import asyncio
import logging
import urllib.request

from app.core.config import Settings

logger = logging.getLogger("fuelkenya.web_cache")


def _post(url: str, token: str) -> int:
    req = urllib.request.Request(
        url,
        data=b"",
        method="POST",
        headers={"Authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(req, timeout=10) as res:  # noqa: S310 (fixed https URL from settings)
        return res.status


async def clear_web_cache(settings: Settings) -> bool:
    """Best effort: an ingest that succeeded must never fail because of this."""
    if not settings.web_revalidate_url or not settings.ingest_token:
        return False
    try:
        status_code = await asyncio.to_thread(_post, settings.web_revalidate_url, settings.ingest_token)
        return 200 <= status_code < 300
    except Exception:  # network error, 401, 503 ...
        logger.exception("Could not clear the website's price cache")
        return False
