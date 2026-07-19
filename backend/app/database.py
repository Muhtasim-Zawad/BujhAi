import asyncio

from alembic.config import Config
from alembic import command
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    loop = asyncio.get_event_loop()
    cfg = Config("alembic.ini")
    await loop.run_in_executor(None, command.upgrade, cfg, "head")
