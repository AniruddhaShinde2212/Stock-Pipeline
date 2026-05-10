import React from "react";

export default function QuoteCard({ quote, selected, onClick }) {
  const up = quote.change_pct >= 0;

  return (
    <button
      onClick={() => onClick(quote.symbol)}
      style={{
        background:   selected ? "var(--surface-2)" : "var(--surface)",
        border:       `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        borderRadius: "var(--radius)",
        padding:      "14px 16px",
        textAlign:    "left",
        cursor:       "pointer",
        transition:   "all var(--transition)",
        width:        "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--text)" }}>
          {quote.symbol}
        </span>
        <span
          style={{
            fontSize:        11,
            fontFamily:      "var(--font-mono)",
            color:           up ? "var(--accent)" : "var(--red)",
            background:      up ? "var(--accent-dim)" : "var(--red-dim)",
            padding:         "2px 6px",
            borderRadius:    3,
          }}
        >
          {up ? "▲" : "▼"} {Math.abs(quote.change_pct).toFixed(2)}%
        </span>
      </div>

      <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: up ? "var(--accent)" : "var(--red)" }}>
        ${quote.price?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </div>

      <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-muted)" }}>
        Prev {quote.prev_close?.toFixed(2)}
      </div>
    </button>
  );
}
