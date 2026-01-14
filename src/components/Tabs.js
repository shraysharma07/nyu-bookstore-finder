import React from "react";

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Book requirement tabs"
      style={{
        background: "#e5e7eb",
        padding: 6,
        borderRadius: 14,
        display: "flex",
        gap: 6,
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {tabs.map(t => {
        const selected = active === t.key;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(t.key)}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid " + (selected ? "rgba(0,0,0,0.12)" : "transparent"),
              background: selected ? "#ffffff" : "transparent",
              boxShadow: selected ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              fontWeight: 700,
              fontSize: 14,
              color: selected ? "#111827" : "#374151",
              cursor: "pointer",
            }}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span style={{
                marginLeft: 8,
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 999,
                background: selected ? "#f3f4f6" : "#d1d5db",
                color: "#111827",
                verticalAlign: "middle",
              }}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
