"""
MedAssist AI — FastAPI application entrypoint.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routes import (
    admin,
    analytics,
    appointments,
    auth,
    diagnostics,
    notifications,
    patients,
    symptoms,
)
from app.core.config import settings
from app.core.rate_limit import limiter
from starlette.types import ASGIApp, Receive, Scope, Send

class StripPrefixMiddleware:
    def __init__(self, app: ASGIApp, prefix: str):
        self.app = app
        self.prefix = prefix

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] in ("http", "websocket"):
            path = scope.get("path", "")
            if path.startswith(self.prefix):
                # Strip the prefix
                new_path = path[len(self.prefix):]
                # Normalize to prevent double slashes at the start (e.g. //api/v1)
                if new_path.startswith("//"):
                    new_path = "/" + new_path.lstrip("/")
                
                scope["path"] = new_path
                scope["root_path"] = self.prefix + scope.get("root_path", "")
        await self.app(scope, receive, send)


# ============================================================
# FastAPI Application
# ============================================================

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI-powered medical symptom analysis & disease "
        "prediction platform — full system API"
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)


# ============================================================
# Rate Limiting
# ============================================================

app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)

# Strip /api/backend prefix passed by Vercel
app.add_middleware(StripPrefixMiddleware, prefix="/api/backend")


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)


# ============================================================
# API Routers
# ============================================================

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(symptoms.router)
app.include_router(diagnostics.router)
app.include_router(analytics.router)
app.include_router(appointments.router)
app.include_router(notifications.router)
app.include_router(admin.router)


# ============================================================
# Health / Test Routes
# ============================================================

@app.get("/", tags=["Health"])
async def root():
    return {
        "service": settings.APP_NAME,
        "status": "ok",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint to ensure backend is running.
    (Vercel expects a JSON response returning status healthy)
    """
    return {
        "status": "healthy",
        "source": "fastapi",
        "message": "MedAssist AI backend is running"
    }
