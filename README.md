# 📈 Stock Pipeline

A data engineering project that ingests real-time and historical stock data, stores it in SQLite, exposes it via a FastAPI backend, and displays it in a React dashboard.

```
yfinance  →  Python pipeline  →  SQLite  →  FastAPI  →  React UI
```

## Stack

| Layer       | Technology          |
|-------------|---------------------|
| Ingestion   | yfinance (free, no API key) |
| Storage     | SQLite (swap to Postgres easily) |
| Scheduler   | APScheduler         |
| API         | FastAPI + Uvicorn   |
| Frontend    | React + Recharts    |

## Project Structure

```
stock-pipeline/
├── backend/
│   ├── ingestion/
│   │   └── fetcher.py        # yfinance data fetching + indicators
│   ├── storage/
│   │   └── database.py       # SQLite schema + queries
│   └── api/
│       └── main.py           # FastAPI endpoints
├── frontend/
│   ├── src/
│   │   ├── components/       # QuoteCard, PriceChart, …
│   │   ├── utils/api.js      # API client
│   │   └── App.jsx           # Main dashboard
│   ├── package.json
│   └── vite.config.js
├── data/                     # SQLite DB lives here (git-ignored)
├── pipeline.py               # Orchestrator / scheduler entry point
├── requirements.txt
└── README.md
```

## Quick Start

### 1. Clone & set up Python

```bash
git clone https://github.com/<you>/stock-pipeline.git
cd stock-pipeline

python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run the pipeline (one-shot)

```bash
python pipeline.py
```

This fetches 6 months of OHLCV data for all symbols in `WATCHLIST` and saves it to `data/stocks.db`.

### 3. Start the API

```bash
uvicorn backend.api.main:app --reload --port 8000
```

API docs available at **http://localhost:8000/docs**

### 4. Start the React frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

### 5. (Optional) Run the scheduler

Keep the pipeline running continuously — quotes refresh every 5 min, daily OHLCV at 18:00 UTC:

```bash
python pipeline.py --schedule
```

## API Endpoints

| Method | Path                        | Description                         |
|--------|-----------------------------|-------------------------------------|
| GET    | `/symbols`                  | All symbols in DB                   |
| GET    | `/quotes`                   | Latest real-time quotes             |
| GET    | `/prices/{symbol}?days=180` | Historical OHLCV + MA20/50          |
| GET    | `/summary/{symbol}`         | Performance summary                 |
| GET    | `/compare?symbols=AAPL,MSFT`| Indexed comparison (base = 100)     |

## Customising the Watchlist

Edit `WATCHLIST` in `backend/ingestion/fetcher.py`:

```python
WATCHLIST = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "SPY"]
```

## Upgrading to Postgres

Replace `backend/storage/database.py` with a `psycopg2` / SQLAlchemy version and update the connection string. The rest of the code is unchanged.

## GitHub Setup

```bash
git init
git add .
git commit -m "feat: initial stock pipeline"
gh repo create stock-pipeline --public --push
```
