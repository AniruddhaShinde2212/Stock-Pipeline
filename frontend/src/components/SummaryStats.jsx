import React from "react";

function Stat({ label, value, highlight }) {
  return (
    <div style={{
      background:   "var(--surface)",
      border:       "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding:      "12px 14px",
    }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize:   16,
        fontWeight: 700,
        color:      highlight || "var(--text)",
      }}>
        {value}
      </div>
    </div>
  );
}

export default function SummaryStats({ summary }) {
  if (!summary) return null;

  const returnColor = summary.ytd_return_pct >= 0 ? "var(--accent)" : "var(--red)";
  const returnSign  = summary.ytd_return_pct >= 0 ? "+" : "";

  return (
    <div
      style={{
        display:             "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap:                 10,
        marginBottom:        24,
      }}
    >
      <Stat label="Latest Close" value={`$${summary.latest_close?.toLocaleString()}`} />
      <Stat
        label="Period Return"
        value={`${returnSign}${summary.ytd_return_pct?.toFixed(2)}%`}
        highlight={returnColor}
      />
      <Stat label="52W High" value={`$${summary.["52w_high"]?.toLocaleString()}`} highlight="var(--accent)" />
      <Stat label="52W Low"  value={`$${summary.["52w_low"]?.toLocaleString()}`}  highlight="var(--red)" />
      <Stat label="Avg Volume" value={summary.avg_volume?.toLocaleString()} />
      <Stat label="As of" value={summary.latest_date} />
    </div>
  );
}
