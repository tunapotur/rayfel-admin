"use client";

import Link from "next/link";

interface StepIndicatorProps {
  current: 1 | 2 | 3;
  slug?: string;
  type?: string;
  isEdit?: boolean;
}

const steps = [
  { n: 1, label: "Meta Bilgiler" },
  { n: 2, label: "Dosyalar" },
  { n: 3, label: "İçerik" },
];

function stepHref(n: number, slug?: string, type?: string, isEdit?: boolean): string | null {
  if (!slug || !type || !isEdit) return null;
  if (n === 1) return `/compose/${slug}?type=${type}&edit=true`;
  if (n === 2) return `/compose/${slug}/files?type=${type}&edit=true`;
  if (n === 3) return `/compose/${slug}/editor?type=${type}&edit=true`;
  return null;
}

export default function StepIndicator({ current, slug, type, isEdit }: StepIndicatorProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36 }}>
      {steps.map((s, i) => {
        const done = s.n < current;
        const active = s.n === current;
        const href = stepHref(s.n, slug, type, isEdit);
        const canNav = isEdit && !active && href;

        const circle = (
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
        );

        const label = (
          <span style={{
            fontSize: 13, fontWeight: active ? 500 : 400,
            color: active ? "var(--text)" : canNav ? "var(--accent)" : done ? "var(--text-muted)" : "var(--text-subtle)",
            textDecoration: canNav ? "underline" : "none",
            textDecorationColor: "var(--accent)",
            textUnderlineOffset: 3,
          }}>
            {s.label}
          </span>
        );

        const inner = (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {circle}
            {label}
          </div>
        );

        return (
          <div key={s.n} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "initial" }}>
            {canNav && href ? (
              <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link>
            ) : (
              inner
            )}
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
