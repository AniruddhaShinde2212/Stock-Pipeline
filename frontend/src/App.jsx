import React, { useState, useEffect, useCallback } from "react";
import { api } from "./utils/api";
import QuoteCard from "./components/QuoteCard";
import PriceChart from "./components/PriceChart";

/* ── tiny inline helpers ──────────────────────────────────────────── */

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
      <div className="pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
      Loading…
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      background:   "var(--surface)",
      border:       "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding:      "10px 14px",
      minWidth:     120,
    }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: color || "var(--text)" }}>{value}</div>
    </div>
  );
}

/* ── App ──────────────────────────────────────────────────────────── */

export default function App() {
  const [quotes,  setQuotes]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [prices,  setPrices]  = useState([]);
  const [summary, setSummary] = useState(null);
  const [days,    setDays]    = useState(180);
  const [loading, setLoading] = useState({ quotes: true, prices: false });
  const [error,   setError]   = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /* Load quotes on mount + every 60s */
  const loadQuotes = useCallback(async () => {
    try {
      const data = await api.quotes();
      setQuotes(data);
      setLastUpdated(new Date().toLocaleTimeString());
      if (!selected && data.length) setSelected(data[0].symbol);
    } catch (e) {
      setError("Cannot reach API — is FastAPI running on port 8000?");
    } finally {
      setLoading((l) => ({ ...l, quotes: false }));
    }
  }, [selected]);

  useEffect(() => {
    loadQuotes();
    const id = setInterval(loadQuotes, 60_000);
    return () => clearInterval(id);
  }, []);

  /* Load prices when symbol or days change */
  useEffect(() => {
    if (!selected) return;
    setLoading((l) => ({ ...l, prices: true }));
    Promise.all([api.prices(selected, days), api.summary(selected)])
      .then(([p, s]) => { setPrices(p); setSummary(s); })
      .catch(() => setError(`Failed to load data for ${selected}`))
      .finally(() => setLoading((l) => ({ ...l, prices: false })));
  }, [selected, days]);

  const quote = quotes.find((q) => q.symbol === selected);
  const up    = (quote?.change_pct ?? 0) >= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <header style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "0 24px",
        height:         56,
        borderBottom:   "1px solid var(--border)",
        background:     "var(--surface)",
        position:       "sticky",
        top:            0,
        zIndex:         10,
      }}>
        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>
          <span style={{ color: "var(--accent)" }}>▣</span> STOCK <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>PIPELINE</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {lastUpdated ? `Updated ${lastUpdated}` : <span className="pulse">connecting…</span>}
        </div>
      </header>

      {error && (
        <div style={{
          background: "var(--red-dim)", borderBottom: "1px solid var(--red)",
          padding: "10px 24px", fontSize: 13, color: "var(--red)", fontFamily: "var(--font-mono)"
        }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Sidebar: quote cards ── */}
        <aside style={{
          width:        220,
          borderRight:  "1px solid var(--border)",
          overflowY:    "auto",
          padding:      "16px 12px",
          display:      "flex",
          flexDirection:"column",
          gap:          8,
          background:   "var(--bg)",
          flexShrink:   0,
        }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, paddingLeft: 2 }}>
            Watchlist
          </div>
          {loading.quotes ? <Spinner /> : quotes.map((q) => (
            <QuoteCard
              key={q.symbol}
              quote={q}
              selected={q.symbol === selected}
              onClick={setSelected}
            />
          ))}
        </aside>

        {/* ── Main panel ── */}
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {!selected ? (
            <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Select a symbol to begin</div>
          ) : (
            <div className="fade-in">
              {/* Symbol header */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 20 }}>
                <h1 style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, letterSpacing: 1 }}>{selected}</h1>
                {quote && (
                  <>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 24, color: up ? "var(--accent)" : "var(--red)" }}>
                      ${quote.price?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 13,
                      color:      up ? "var(--accent)" : "var(--red)",
                      background: up ? "var(--accent-dim)" : "var(--red-dim)",
                      padding:    "2px 8px", borderRadius: 4,
                    }}>
                      {up ? "▲" : "▼"} {Math.abs(quote.change_pct).toFixed(2)}%
                    </span>
                  </>
                )}
              </div>

              {/* Summary pills */}
              {summary && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
                  <StatPill label="Period Return" value={`${summary.ytd_return_pct >= 0 ? "+" : ""}${summary.ytd_return_pct?.toFixed(2)}%`} color={summary.ytd_return_pct >= 0 ? "var(--accent)" : "var(--red)"} />
                  <StatPill label="52W High" value={`$${summary["52w_high"]?.toLocaleString()}`} color="var(--accent)" />
                  <StatPill label="52W Low"  value={`$${summary["52w_low"]?.toLocaleString()}`}  color="var(--red)" />
                  <StatPill label="Avg Volume" value={summary.avg_volume?.toLocaleString()} />
                  <StatPill label="As of" value={summary.latest_date} />
                </div>
              )}

              {/* Chart */}
              <div style={{
                background:   "var(--surface)",
                border:       "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding:      "20px 20px 12px",
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
                  Price + Moving Averages
                </div>
                {loading.prices
                  ? <div style={{ height: 340, display: "flex", alignItems: "center" }}><Spinner /></div>
                  : <PriceChart data={prices} symbol={selected} onDaysChange={setDays} />
                }
              </div>

              {/* Volume bar */}
              {!loading.prices && prices.length > 0 && (
                <div style={{
                  marginTop:    12,
                  background:   "var(--surface)",
                  border:       "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding:      "20px 20px 12px",
                }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
                    Volume
                  </div>
                  <VolumeChart data={prices} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ── Volume chart (inline, keeps imports minimal) ─────────────────── */
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function VolumeChart({ data }) {
  const formatted = data.map((d) => ({
    dateLabel: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    volume:    d.volume,
    close:     d.close,
    open:      d.open,
  }));

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={formatted} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
        <XAxis dataKey="dateLabel" tick={{ fill: "#6b7685", fontSize: 10, fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: "#6b7685", fontSize: 10, fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} width={55} tickFormatter={(v) => v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : v.toLocaleString()} />
        <Tooltip
          formatter={(v) => [v.toLocaleString(), "Volume"]}
          contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", fontFamily: "var(--font-mono)", fontSize: 11 }}
          cursor={{ fill: "var(--border)" }}
        />
        <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
          {formatted.map((d, i) => (
            <Cell key={i} fill={d.close >= d.open ? "#00e5a040" : "#ff4d6a40"} stroke={d.close >= d.open ? "#00e5a0" : "#ff4d6a"} strokeWidth={1} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
