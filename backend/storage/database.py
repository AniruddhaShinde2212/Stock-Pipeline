"""
SQLite storage layer for stock pipeline.
Schema is created on first run; upserts avoid duplicate rows.
"""

import sqlite3
import pandas as pd
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).resolve().parents[2] / "data" / "stocks.db"


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create tables if they don't exist."""
    conn = get_connection()
    cur = conn.cursor()

    cur.executescript("""
        CREATE TABLE IF NOT EXISTS daily_prices (
            symbol       TEXT    NOT NULL,
            date         TEXT    NOT NULL,
            open         REAL,
            high         REAL,
            low          REAL,
            close        REAL,
            volume       INTEGER,
            ma_20        REAL,
            ma_50        REAL,
            daily_return REAL,
            PRIMARY KEY (symbol, date)
        );

        CREATE TABLE IF NOT EXISTS latest_quotes (
            symbol      TEXT PRIMARY KEY,
            price       REAL,
            prev_close  REAL,
            change_pct  REAL,
            market_cap  REAL,
            high_52w    REAL,
            low_52w     REAL,
            updated_at  TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_prices_symbol_date
            ON daily_prices (symbol, date DESC);
    """)

    conn.commit()
    conn.close()
    logger.info(f"DB initialised at {DB_PATH}")


def upsert_prices(df: pd.DataFrame) -> int:
    """
    Insert or replace daily price rows.
    Returns number of rows written.
    """
    if df.empty:
        return 0

    df = df.copy()
    df["date"] = df["date"].astype(str)

    conn = get_connection()
    rows = df[["symbol","date","open","high","low","close","volume","ma_20","ma_50","daily_return"]].to_dict("records")

    cur = conn.cursor()
    cur.executemany("""
        INSERT OR REPLACE INTO daily_prices
            (symbol, date, open, high, low, close, volume, ma_20, ma_50, daily_return)
        VALUES
            (:symbol, :date, :open, :high, :low, :close, :volume, :ma_20, :ma_50, :daily_return)
    """, rows)

    conn.commit()
    written = cur.rowcount
    conn.close()
    logger.info(f"Upserted {len(rows)} price rows")
    return len(rows)


def upsert_quote(quote: dict) -> None:
    """Upsert a single latest-quote record."""
    if not quote:
        return
    conn = get_connection()
    conn.execute("""
        INSERT OR REPLACE INTO latest_quotes
            (symbol, price, prev_close, change_pct, market_cap, high_52w, low_52w, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        quote.get("symbol"),
        quote.get("price"),
        quote.get("prev_close"),
        quote.get("change_pct"),
        quote.get("market_cap"),
        quote.get("52w_high"),
        quote.get("52w_low"),
        quote.get("timestamp"),
    ))
    conn.commit()
    conn.close()


def query_prices(symbol: str, days: int = 180) -> pd.DataFrame:
    conn = get_connection()
    df = pd.read_sql_query("""
        SELECT * FROM daily_prices
        WHERE symbol = ?
        ORDER BY date DESC
        LIMIT ?
    """, conn, params=(symbol, days))
    conn.close()
    return df


def query_all_symbols() -> list[str]:
    conn = get_connection()
    cur = conn.execute("SELECT DISTINCT symbol FROM daily_prices ORDER BY symbol")
    symbols = [r[0] for r in cur.fetchall()]
    conn.close()
    return symbols


def query_latest_quotes() -> list[dict]:
    conn = get_connection()
    cur = conn.execute("SELECT * FROM latest_quotes ORDER BY symbol")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


if __name__ == "__main__":
    init_db()
    print("DB ready at", DB_PATH)
