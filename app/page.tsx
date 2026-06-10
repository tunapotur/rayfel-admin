import ContentList from "@/components/ContentList";
import { readAllContents } from "@/lib/fs-helpers";
import { ContentMeta } from "@/lib/types";
import Link from "next/link";

function getAllContent(): ContentMeta[] {
  try {
    return readAllContents().sort((a, b) => a.id > b.id ? -1 : 1);
  } catch {
    return [];
  }
}

export default function HomePage() {
  const contents = getAllContent();

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 8 }}>
          İçerik Yönetimi
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Yeni haber veya duyuru oluştur, mevcut içerikleri düzenle.
        </p>
      </div>

      <Link href="/compose" style={{ textDecoration: "none" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "var(--accent-dim)", border: "1px dashed var(--accent)",
          borderRadius: "var(--radius)", padding: "16px 20px",
          cursor: "pointer", marginBottom: 32,
        }}>
          <div style={{
            width: 32, height: 32, background: "var(--accent)",
            borderRadius: "var(--radius-sm)", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 18, color: "#fff", flexShrink: 0,
          }}>+</div>
          <div>
            <div style={{ fontWeight: 500, color: "var(--accent)", fontSize: 14 }}>
              Yeni İçerik Oluştur
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
              Haber veya duyuru ekle
            </div>
          </div>
        </div>
      </Link>

      {contents.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          color: "var(--text-muted)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>Henüz içerik yok</div>
          <div style={{ fontSize: 13 }}>İlk içeriğini oluşturmak için yukarıdaki butona tıkla.</div>
        </div>
      ) : (
        <ContentList contents={contents} />
      )}
    </div>
  );
}
