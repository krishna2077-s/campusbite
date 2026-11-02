from __future__ import annotations

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("campusbite")


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()
        response = await call_next(request)
        process_time = (time.perf_counter() - start_time) * 1000
        logger.info(
            "method=%s path=%s status=%d duration=%.2fms",
            request.method,
            request.url.path,
            response.status_code,
            process_time,
        )
        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
        return response
