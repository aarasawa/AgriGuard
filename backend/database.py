import os
import psycopg_pool
from dotenv import load_dotenv

load_dotenv()

_pool: psycopg_pool.ConnectionPool | None = None


def init_pool() -> None:
    global _pool
    _pool = psycopg_pool.ConnectionPool(
        conninfo=os.getenv("DATABASE_URL"),
        min_size=1,
        max_size=10,
        open=True,
    )


def get_pool() -> psycopg_pool.ConnectionPool:
    if _pool is None:
        raise RuntimeError("Connection pool has not been initialised. Call init_pool() first.")
    return _pool


def close_pool() -> None:
    if _pool is not None:
        _pool.close()