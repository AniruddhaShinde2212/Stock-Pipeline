"""
FastAPI backend — serves stock data to the React frontend.

Run with:
    uvicorn backend.api.main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from typing import Optional

from backend.storage.database import (
    init_db,
    query_prices,
    query_all_symbols,
    query_latest_quotes,
)

app = FastAPI(
    title="Stock Pipeline API",
    description="Real-time & historical stock data powered by yfinance + SQLite",
    version="1.0.0",
)

# Allow React dev server (port 5173 / 3000) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "message": "Stock Pipeline API is running"}


@app.get("/symbols", tags=["meta"])
def get_symbols() -> list[str]:
    """Return all ticker symbols available in the database."""
    return query_all_symbols()


@app.get("/quotes", tags=["quotes"])
def get_quotes() -> list[dict]:
    """Return latest real-time quotes for all watched symbols."""
    return query_latest_quotes()


@app.get("/prices/{symbol}", tags=["prices"])
def get_prices(
    symbol: str,
    days: int = Query(default=180, ge=5, le=730, description="Number of trading days to return"),
) -> list[dict]:
    """Return historical OHLCV + indicators for a given symbol."""
    symbol = symbol.upper()
    df = query_prices(symbol, days=days)
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No data found for symbol '{symbol}'")
    # Return chronological order for charts
    df = df.sort_values("date")
    return df.to_dict("records")


@app.get("/summary/{symbol}", tags=["prices"])
def get_summary(symbol: str) -> dict:
    """Return a quick performance summary for a symbol."""
    symbol = symbol.upper()
    df = query_prices(symbol, days=365)
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No data found for symbol '{symbol}'")

    df = df.sort_values("date")
    latest = df.iloc[-1]
    oldest = df.iloc[0]

    return {
        "symbol": symbol,
        "latest_close": round(float(latest["close"]), 2),
        "latest_date": latest["date"],
        "start_close": round(float(oldest["close"]), 2),
        "start_date": oldest["date"],
        "ytd_return_pct": round(
            (float(latest["close"]) - float(oldest["close"])) / float(oldest["close"]) * 100, 2
        ),
        "52w_high": round(float(df["high"].max()), 2),
        "52w_low": round(float(df["low"].min()), 2),
        "avg_volume": int(df["volume"].mean()),
    }


@app.get("/compare", tags=["prices"])
def compare_symbols(
    symbols: str = Query(description="Comma-separated tickers, e.g. AAPL,MSFT,NVDA"),
    days: int = Query(default=180, ge=5, le=730),
) -> dict:
    """
    Return normalised close prices (base=100) for multiple symbols —
    useful for relative performance charts.
    """
    result = {}
    for sym in [s.strip().upper() for s in symbols.split(",")]:
        df = query_prices(sym, days=days).sort_values("date")
        if df.empty:
            continue
        base = float(df.iloc[0]["close"])
        result[sym] = [
            {"date": row["date"], "indexed": round(float(row["close"]) / base * 100, 2)}
            for _, row in df.iterrows()
        ]
    return result
