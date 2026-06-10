"use client";

import Link from "next/link";
import { ContentMeta } from "@/lib/types";

const typeLabel: Record<string, string> = {
  news: "Haber",
  mobility: "Hareketlilik",
  dissemination: "Yaygınlaştırma",
  announcements: "Duyuru",
};

function statusBadge(content: ContentMeta) {
  if (!content.mainText) return { label: "Taslak", color: "var(--warning)" };
  if (!content.headline_image) return { label: "Görsel Yok", color: "var(--text-muted)" };
  return { label: "Hazır", color: "var(--success)" };
}

export default function ContentList({ contents }: { contents: ContentMeta[] }) {
  return (
    <div>
      <div style={{
        color: "var(--text-muted)", fontSize: 12,
        marginBottom: 12, fontFamily: "DM Mono, monospace",
      }}>
        {contents.length} içerik
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {contents.map((c) => {
          const status = statusBadge(c);
          return (
            <ContentRow key={`${c.type}-${c.slug}`} c={c} status={status} />
          );
        })}
      </div>
    </div>
  );
}

function ContentRow({
  c,
  status,
}: {
  c: ContentMeta;
  status: { label: string; color: string };
}) {
  return (
    <Link
      href={`/compose?slug=${c.slug}&type=${c.type}&edit=true`}
      style={{ textDecoration: "none" }}
    >
      <div className="content-row">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 500, fontSize: 14, color: "var(--text)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {c.title}
          </div>
          <div style={{ marginTop: 3 }}>
            <span style={{
              fontSize: 11, color: "var(--text-muted)",
              fontFamily: "DM Mono, monospace",
            }}>
              {c.slug}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 20,
            background: "var(--bg-input)", color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}>
            {typeLabel[c.newsType || c.type] || c.type}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.date}</span>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: status.color, flexShrink: 0,
          }} title={status.label} />
        </div>
      </div>
    </Link>
  );
}
