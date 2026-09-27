import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

try:
    from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
    REQUESTS_TOTAL = Counter(
        "rewardshub_http_requests_total",
        "Total HTTP Requests handled by RewardsHub API",
        ["method", "path", "status"]
    )
    REQUEST_DURATION = Histogram(
        "rewardshub_http_request_duration_seconds",
        "HTTP Request Latency in seconds",
        ["method", "path"]
    )
except ImportError:
    Counter = Histogram = generate_latest = CONTENT_TYPE_LATEST = None
    REQUESTS_TOTAL = REQUEST_DURATION = None

from app.database.migrator import run_migrations
from app.routers.auth import router as auth_router
from app.routers.coupons import router as coupons_router
from app.routers.marketplace import router as marketplace_router
from app.routers.notifications import router as notifications_router
from app.routers.users import router as users_router
from app.routers.admin import router as admin_router
from app.services.helpers import create_audit_log, create_notification


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Run schema checks and apply migrations
    try:
        run_migrations()
    except Exception as e:
        print(f"Migration error on startup: {e}")
    yield
    # Shutdown logic if needed


environment = os.getenv("ENVIRONMENT", "development").lower()
is_production = environment == "production"

app = FastAPI(
    title="RewardsHub API",
    version="2.0.0",
    description="Full-stack coupon, rewards and escrow marketplace API",
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    openapi_url=None if is_production else "/openapi.json",
    lifespan=lifespan
)

# CORS configuration
cors_origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:3000"
)
cors_origins = [orig.strip() for orig in cors_origins_env.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def prometheus_metrics_middleware(request: Request, call_next):
    # Skip metrics scrape path itself from distorting telemetry
    if request.url.path == "/metrics":
        return await call_next(request)

    start_time = time.time()
    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception:
        status_code = 500
        raise
    finally:
        duration = time.time() - start_time
        path = request.url.path
        if REQUESTS_TOTAL and REQUEST_DURATION:
            REQUESTS_TOTAL.labels(method=request.method, path=path, status=str(status_code)).inc()
            REQUEST_DURATION.labels(method=request.method, path=path).observe(duration)

    return response


# Health and Prometheus Metrics Endpoints
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "healthy",
        "service": "RewardsHub API",
        "version": "2.0.0"
    }


@app.get("/metrics", tags=["Observability"])
def metrics():
    if generate_latest is None:
        return Response(content="# Prometheus client not installed\n", media_type="text/plain")
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


# Mount Modular Feature Routers
app.include_router(auth_router)
app.include_router(coupons_router)
app.include_router(marketplace_router)
app.include_router(notifications_router)
app.include_router(users_router)
app.include_router(admin_router)
