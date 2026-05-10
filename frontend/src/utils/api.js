// Centralised API calls — all point to FastAPI via Vite proxy (/api → :8000)

const BASE = "/api";

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export const api = {
  symbols:  ()                    => get("/symbols"),
  quotes:   ()                    => get("/quotes"),
  prices:   (symbol, days = 180)  => get(`/prices/${symbol}?days=${days}`),
  summary:  (symbol)              => get(`/summary/${symbol}`),
  compare:  (symbols, days = 180) => get(`/compare?symbols=${symbols}&days=${days}`),
};
