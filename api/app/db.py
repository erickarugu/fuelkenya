from __future__ import annotations
from collections.abc import AsyncGenerator
import logging

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Index,
    Integer,
    MetaData,
    Numeric,
    String,
    Table,
    UniqueConstraint,
    event,
    func,
)
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker


from app.core.config import get_settings

settings = get_settings()

logger = logging.getLogger("fuelkenya.sql")
engine = create_async_engine(
    settings.database_url,
    future=True,
    echo=False,
)
async_session = async_sessionmaker(engine, expire_on_commit=False)
metadata = MetaData()

if settings.sql_echo:
    logger.setLevel(getattr(logging, settings.log_level.upper(), logging.INFO))

    @event.listens_for(engine.sync_engine, "before_cursor_execute")
    def before_cursor_execute(
        conn, cursor, statement, parameters, context, executemany
    ):
        logger.info("SQL QUERY: %s | params=%s", statement, parameters)


fuel_prices = Table(
    "fuel_prices",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("town", String(100), nullable=False),
    Column("super_petrol", Numeric(6, 2), nullable=False),
    Column("diesel", Numeric(6, 2), nullable=False),
    Column("kerosene", Numeric(6, 2), nullable=False),
    Column("valid_from", Date, nullable=False),
    Column("valid_to", Date, nullable=False),
    Column(
        "created_at", DateTime(timezone=True), server_default=func.current_timestamp()
    ),
    UniqueConstraint("town", "valid_from", name="uq_town_valid_from"),
)

Index("idx_fuel_prices_town", func.lower(fuel_prices.c.town))
Index("idx_fuel_prices_valid_from", fuel_prices.c.valid_from)
Index("idx_fuel_prices_date_range", fuel_prices.c.valid_from, fuel_prices.c.valid_to)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


def build_upsert_statement(records):
    insert_stmt = pg_insert(fuel_prices).values(records)
    update_values = {
        "super_petrol": insert_stmt.excluded.super_petrol,
        "diesel": insert_stmt.excluded.diesel,
        "kerosene": insert_stmt.excluded.kerosene,
        "valid_to": insert_stmt.excluded.valid_to,
    }
    return insert_stmt.on_conflict_do_update(
        index_elements=[fuel_prices.c.town, fuel_prices.c.valid_from],
        set_=update_values,
    )
