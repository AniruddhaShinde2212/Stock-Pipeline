import React, { useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const PERIODS = [
  { label: "1M",  days: 30  },
  { label: "3M",  days: 90  },
  { label: "6M",  days: 180 },
  { label: "1Y",  days: 365 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:   "var(--surface-2)",
      border:       "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding:      "10px 14px",
      fontFamily:   "var(--font-mono)",
      fontSize:     12,
    }}>
      <div style={{ color: "var(--text-muted)", marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, lineHeight: 1.8 }}>
          {p.name}: <strong>${p.value?.toFixed(2)}</strong>
        </div>
      ))}
    </div>
  );
};

export default function PriceChart({ data, symbol, onDaysChange }) {
  const [activePeriod, setActivePeriod] = useState("6M");

  const handlePeriod = (p) => {
    setActivePeriod(p.label);
    onDaysChange(p.days);
  };

  if (!data?.length) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--text-muted)" }}>
        No price data available
      </div>
    );
  }

  // Format dates for x-axis
  const formatted = data.map((d) => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  const minPrice = Math.min(...data.map(d => d.low)) * 0.995;
  const maxPrice = Math.max(...data.map(d => d.high)) * 1.005;

  return (
    <div className="fade-in">
      {/* Period selector */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {PERIODS.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePeriod(p)}
            style={{
              padding:      "4px 12px",
              borderRadius: "var(--radius)",
              border:       `1px solid ${activePeriod === p.label ? "var(--accent)" : "var(--border)"}`,
              background:   activePeriod === p.label ? "var(--accent-dim)" : "transparent",
              color:        activePeriod === p.label ? "var(--accent)" : "var(--text-muted)",
              fontFamily:   "var(--font-mono)",
              fontSize:     12,
              transition:   "all var(--transition)",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={formatted} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#00e5a0" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#00e5a0" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#1e2530" strokeDasharray="4 4" vertical={false} />

          <XAxis
            dataKey="dateLabel"
            tick={{ fill: "#6b7685", fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minPrice, maxPrice]}
            tick={{ fill: "#6b7685", fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            width={60}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}
          />

          <Area
            type="monotone"
            dataKey="close"
            name="Close"
            stroke="#00e5a0"
            strokeWidth={2}
            fill="url(#priceGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#00e5a0" }}
          />
          <Line
            type="monotone"
            dataKey="ma_20"
            name="MA 20"
            stroke="#f5c542"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
          />
          <Line
            type="monotone"
            dataKey="ma_50"
            name="MA 50"
            stroke="#4db8ff"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
