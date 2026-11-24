from __future__ import annotations

import hmac
import math
import time
from collections import deque
from typing import Deque

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings

TRUSTED_CLIENT_HEADER = "x-fuelkenya-client-token"


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app) -> None:
        super().__init__(app)
        settings = get_settings()
        self.max_requests = settings.rate_limit_max_requests
        self.window_seconds = settings.rate_limit_window_seconds
        self.exempt_paths = set(settings.rate_limit_exempt_paths)
        self.trusted_client_token = settings.trusted_client_token
        self._requests: dict[str, Deque[float]] = {}
        self._last_sweep = time.monotonic()

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.exempt_paths or self._is_trusted(request):
            return await call_next(request)

        now = time.monotonic()
        window_start = now - self.window_seconds
        self._sweep(now, window_start)

        key = self._get_client_address(request)
        request_times = self._requests.setdefault(key, deque())
        while request_times and request_times[0] <= window_start:
            request_times.popleft()

        if len(request_times) >= self.max_requests:
            # Return the 429 directly. Raising HTTPException here surfaces as a
            # 500, because FastAPI's exception handlers only wrap the router,
            # not middleware.
            retry_after = max(
                1, math.ceil(request_times[0] + self.window_seconds - now)
            )
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Try again later."},
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(self.max_requests),
                    "X-RateLimit-Remaining": "0",
                },
            )

        request_times.append(now)
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(
            max(0, self.max_requests - len(request_times))
        )
        return response

    def _is_trusted(self, request: Request) -> bool:
        """Let our own servers (e.g. the fuelkenya.com renderer) skip the limit.

        All server-rendered page views reach the API from a handful of shared
        hosting IPs, so a per-IP limit would throttle the website itself.
        """
        if not self.trusted_client_token:
            return False
        supplied = request.headers.get(TRUSTED_CLIENT_HEADER, "")
        return hmac.compare_digest(supplied, self.trusted_client_token)

    def _sweep(self, now: float, window_start: float) -> None:
        """Drop idle clients so memory doesn't grow with every IP ever seen."""
        if now - self._last_sweep < self.window_seconds:
            return
        self._last_sweep = now
        idle = [
            key
            for key, times in self._requests.items()
            if not times or times[-1] <= window_start
        ]
        for key in idle:
            del self._requests[key]

    @staticmethod
    def _get_client_address(request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",", 1)[0].strip()

        if request.client is not None:
            return request.client.host

        return "unknown"
