from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Convert PostgresDsn to string to avoid SQLAlchemy argument error
db_uri = str(settings.SQLALCHEMY_DATABASE_URI)

engine = create_async_engine(
    db_uri,
    echo=True,
    future=True,
)

# Use AsyncSession for async IO operations with SQLAlchemy
SessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
)

Base = declarative_base()


# Dependency to get DB session
async def get_db() -> AsyncSession:
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
