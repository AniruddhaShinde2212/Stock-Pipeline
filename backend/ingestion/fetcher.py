"""
Stock data fetcher using yfinance.
Fetches OHLCV data, moving averages, and basic indicators.
"""

import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Default watchlist — edit freely
WATCHLIST = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "SPY"]


def fetch_ticker(symbol: str, period: str = "6mo", interval: str = "1d") -> pd.DataFrame:
    """
    Fetch OHLCV data for a single ticker.

    Args:
        symbol:   Ticker symbol, e.g. "AAPL"
        period:   yfinance period string — "1d","5d","1mo","3mo","6mo","1y","2y","5y","max"
        interval: Bar size — "1m","5m","15m","1h","1d","1wk","1mo"

    Returns:
        DataFrame with columns: symbol, date, open, high, low, close, volume,
                                 ma_20, ma_50, daily_return
    """
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)

        if df.empty:
            logger.warning(f"No data returned for {symbol}")
            return pd.DataFrame()

        df = df.reset_index()
        df.columns = [c.lower() for c in df.columns]

        # Rename 'date' or 'datetime' column
        date_col = "date" if "date" in df.columns else "datetime"
        df = df.rename(columns={date_col: "date"})

        # Keep only what we need
        df = df[["date", "open", "high", "low", "close", "volume"]].copy()
        df["date"] = pd.to_datetime(df["date"]).dt.date
        df["symbol"] = symbol

        # Indicators
        df["ma_20"] = df["close"].rolling(20).mean().round(4)
        df["ma_50"] = df["close"].rolling(50).mean().round(4)
        df["daily_return"] = df["close"].pct_change().round(6)

        logger.info(f"Fetched {len(df)} rows for {symbol}")
        return df

    except Exception as e:
        logger.error(f"Error fetching {symbol}: {e}")
        return pd.DataFrame()


def fetch_all(symbols: list[str] = WATCHLIST, **kwargs) -> pd.DataFrame:
    """Fetch data for all symbols and concatenate into one DataFrame."""
    frames = [fetch_ticker(s, **kwargs) for s in symbols]
    combined = pd.concat([f for f in frames if not f.empty], ignore_index=True)
    logger.info(f"Total rows fetched: {len(combined)}")
    return combined


def fetch_quote(symbol: str) -> dict:
    """Fetch latest real-time quote info for a symbol."""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.fast_info
        return {
            "symbol": symbol,
            "price": round(info.last_price, 2),
            "prev_close": round(info.previous_close, 2),
            "change_pct": round((info.last_price - info.previous_close) / info.previous_close * 100, 2),
            "market_cap": info.market_cap,
            "52w_high": round(info.year_high, 2),
            "52w_low": round(info.year_low, 2),
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error fetching quote for {symbol}: {e}")
        return {}


if __name__ == "__main__":
    df = fetch_all()
    print(df.tail())
