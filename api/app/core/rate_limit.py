from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Deque

from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app) -> None:
        super().__init__(app)
        settings = get_settings()
        self.max_requests = settings.rate_limit_max_requests
        self.window_seconds = settings.rate_limit_window_seconds
        self.exempt_paths = set(settings.rate_limit_exempt_paths)
        self._requests: dict[str, Deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.exempt_paths:
            return await call_next(request)

        client_address = self._get_client_address(request)
        key = client_address
        now = time.monotonic()
        window_start = now - self.window_seconds
        request_times = self._requests[key]

        while request_times and request_times[0] < window_start:
            request_times.popleft()

        if len(request_times) >= self.max_requests:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Try again later.",
            )

        request_times.append(now)
        return await call_next(request)

    @staticmethod
    def _get_client_address(request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",", 1)[0].strip()

        if request.client is not None:
            return request.client.host

        return "unknown"
