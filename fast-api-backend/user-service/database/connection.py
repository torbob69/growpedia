import os

import dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase

DB_PASSWORD = os.getenv("DB_PASSWORD") or dotenv.get_key('C:/Growtopia-RAG/.env', 'DB_PASSWORD')
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5434")
DB_URL = f"postgresql+asyncpg://admin:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/auth-db"

engine = create_async_engine(DB_URL)

class Base(DeclarativeBase):
    pass

async def get_session():
    async with AsyncSession(engine) as session:
        yield session
