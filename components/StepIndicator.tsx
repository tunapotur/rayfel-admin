"use client";

interface StepIndicatorProps {
  current: 1 | 2 | 3;
  slug?: string;
  type?: string;
}

const steps = [
  { n: 1, label: "Meta Bilgiler" },
  { n: 2, label: "Dosyalar" },
  { n: 3, label: "İçerik" },
];

export default function StepIndicator({ current, slug, type }: StepIndicatorProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36 }}>
      {steps.map((s, i) => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <div key={s.n} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "initial" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 600,
                background: done ? "var(--success)" : active ? "var(--accent)" : "var(--bg-input)",
                color: done || active ? "#fff" : "var(--text-muted)",
                border: `1px solid ${done ? "var(--success)" : active ? "var(--accent)" : "var(--border)"}`,
              }}>
                {done ? "✓" : s.n}
              </div>
              <span style={{
                fontSize: 13, fontWeight: active ? 500 : 400,
                color: active ? "var(--text)" : done ? "var(--text-muted)" : "var(--text-subtle)",
              }}>
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div style={{
                flex: 1, height: 1, margin: "0 12px",
                background: done ? "var(--success)" : "var(--border)",
                opacity: done ? 0.5 : 1,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
