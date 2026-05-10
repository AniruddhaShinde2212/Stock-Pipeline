"""
Pipeline orchestrator.

Run once:    python pipeline.py
Run forever: python pipeline.py --schedule

Schedule:
  - Full historical load   → on startup
  - Intraday quote refresh → every 5 minutes (market hours)
  - Daily OHLCV refresh    → every day at 18:00 UTC (after US market close)
"""

import argparse
import logging
from datetime import datetime

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from backend.ingestion.fetcher import fetch_all, fetch_quote, WATCHLIST
from backend.storage.database import init_db, upsert_prices, upsert_quote

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("pipeline")


# ── Jobs ──────────────────────────────────────────────────────────────────────

def job_full_load(period: str = "6mo") -> None:
    """Fetch 6 months of OHLCV data for all symbols."""
    logger.info(f"▶ Full load started (period={period})")
    df = fetch_all(WATCHLIST, period=period)
    n = upsert_prices(df)
    logger.info(f"✔ Full load complete — {n} rows written")


def job_daily_refresh() -> None:
    """Refresh the most recent ~5 days of data (catches any corrections)."""
    logger.info("▶ Daily refresh started")
    df = fetch_all(WATCHLIST, period="5d")
    n = upsert_prices(df)
    logger.info(f"✔ Daily refresh complete — {n} rows written")


def job_quote_refresh() -> None:
    """Fetch real-time quotes for all symbols."""
    logger.info("▶ Quote refresh started")
    for symbol in WATCHLIST:
        quote = fetch_quote(symbol)
        upsert_quote(quote)
    logger.info(f"✔ Quotes refreshed for {len(WATCHLIST)} symbols")


# ── Entry point ───────────────────────────────────────────────────────────────

def run_once() -> None:
    """Run a full load + quote refresh, then exit."""
    init_db()
    job_full_load()
    job_quote_refresh()
    logger.info("One-shot run complete.")


def run_scheduled() -> None:
    """Run jobs on a schedule (blocking)."""
    init_db()

    # Bootstrap on startup
    job_full_load()
    job_quote_refresh()

    scheduler = BlockingScheduler(timezone="UTC")

    # Intraday quotes every 5 minutes
    scheduler.add_job(
        job_quote_refresh,
        trigger=IntervalTrigger(minutes=5),
        id="quote_refresh",
        name="Quote refresh (5 min)",
    )

    # Daily OHLCV at 18:00 UTC (US market closes ~21:00 UTC, data settles by 18:00 next day)
    scheduler.add_job(
        job_daily_refresh,
        trigger=CronTrigger(hour=18, minute=0),
        id="daily_refresh",
        name="Daily OHLCV refresh",
    )

    logger.info("Scheduler started. Press Ctrl+C to stop.")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Stock data pipeline")
    parser.add_argument(
        "--schedule",
        action="store_true",
        help="Run on a schedule (blocking). Default: run once and exit.",
    )
    args = parser.parse_args()

    if args.schedule:
        run_scheduled()
    else:
        run_once()
