import logging

from app.api.api_v1.api import api_router
from app.core.config import settings
from app.db.base import engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Real-time Collaboration Platform API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
async def startup_event():
    logger.info("Starting up application")
    # Initialize database connections
    # try:
    #     # Create initial data in DB
    #     # await init_db()
    #     logger.info("Database initialized successfully")
    # except Exception as e:
    #     logger.error(f"Error initializing database: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down application")
    # Close database connections
    await engine.dispose()
    logger.info("Database connections closed")


@app.get("/")
async def root():
    return {
        "message": "Welcome to the Real-time Collaboration Platform API",
        "docs": f"{settings.SERVER_HOST}/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
