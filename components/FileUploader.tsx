"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "./StepIndicator";
import { FileItem } from "@/lib/types";

/* ── Tipler ──────────────────────────────────────────── */

/** Yeni eklenecek dosya (henüz upload edilmedi) */
interface PendingFile {
  kind: "pending";
  file: File;
  name: string;
  alt: string;
  preview?: string;
  isHeadline: boolean;
}

/** Daha önce yüklenmiş, JSON'da kayıtlı dosya */
interface SavedFile {
  kind: "saved";
  id: number;
  name: string;
  alt: string;
  path: string;
  isHeadline: boolean;
}

type AnyFile = PendingFile | SavedFile;

/* ── Stiller ─────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px",
  background: "var(--bg)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)", color: "var(--text)",
  fontSize: 13, outline: "none", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 500,
  color: "var(--text-muted)", marginBottom: 4,
  textTransform: "uppercase", letterSpacing: "0.04em",
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const MAX_SIZE_MB = 10;

/* ── Yardımcı fonksiyonlar ───────────────────────────── */

function resizeImage(file: File, maxW = 1920, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    if (file.type === "application/pdf") { resolve(file); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return; }
        const isPng = file.name.endsWith(".png");
        resolve(new File([blob], file.name, { type: `image/${isPng ? "png" : "jpeg"}` }));
      }, `image/${file.name.endsWith(".png") ? "png" : "jpeg"}`, quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

function slugifyFileName(original: string): string {
  const ext = original.substring(original.lastIndexOf("."));
  const base = original.substring(0, original.lastIndexOf("."));
  return base.toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ext;
}

function toProxyUrl(publicPath: string): string {
  return `/api/proxy-image?path=${encodeURIComponent(publicPath)}`;
}

function isImage(pathOrName: string) {
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(pathOrName);
}

/* ── Component ───────────────────────────────────────── */

interface FileUploaderProps {
  slug: string;
  type: string;
  isEdit?: boolean;
}

export default function FileUploader({ slug, type, isEdit }: FileUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<AnyFile[]>([]);
  const [loading, setLoading] = useState(!!isEdit);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* Edit modunda mevcut dosyaları yükle */
  useEffect(() => {
    if (!isEdit) return;
    fetch(`/api/list-files?type=${type}&slug=${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;
        const saved: SavedFile[] = [];

        if (data.headline_image) {
          saved.push({
            kind: "saved",
            id: -1,
            name: data.headline_image.split("/").pop() || "headline",
            alt: "Kapak Görseli",
            path: data.headline_image,
            isHeadline: true,
          });
        }
        (data.files as FileItem[]).forEach((f) => {
          saved.push({
            kind: "saved",
            id: f.id,
            name: f.name,
            alt: f.alt,
            path: f.path,
            isHeadline: false,
          });
        });
        setFiles(saved);
        setLoading(false);
      });
  }, [isEdit, slug, type]);

  /* Yeni dosya ekleme */
  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter(
      (f) => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_SIZE_MB * 1024 * 1024
    );
    const hasSavedHeadline = files.some((f) => f.isHeadline && f.kind === "saved");
    const hasPendingHeadline = files.some((f) => f.isHeadline && f.kind === "pending");
    const hasAnyHeadline = hasSavedHeadline || hasPendingHeadline;

    const newFiles: PendingFile[] = arr.map((f, i) => ({
      kind: "pending",
      file: f,
      name: slugifyFileName(f.name),
      alt: "",
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      isHeadline: !hasAnyHeadline && i === 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, [files]);

  /* Saved dosyayı sil */
  const deleteSaved = async (saved: SavedFile) => {
    setDeletingPath(saved.path);
    setError(null);
    try {
      const res = await fetch("/api/delete-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, slug,
          filePath: saved.path,
          isHeadline: saved.isHeadline,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setFiles((prev) => prev.filter((f) => !(f.kind === "saved" && f.path === saved.path)));
    } catch (e) {
      setError(String(e));
    } finally {
      setDeletingPath(null);
    }
  };

  /* Pending dosyayı listeden kaldır */
  const removePending = (idx: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      // Eğer headline kaldırıldıysa, pending olanların ilkine headline ver
      if (prev[idx].isHeadline) {
        const firstPending = next.findIndex((f) => f.kind === "pending");
        const hasSavedHeadline = next.some((f) => f.kind === "saved" && f.isHeadline);
        if (firstPending >= 0 && !hasSavedHeadline) {
          next[firstPending] = { ...next[firstPending], isHeadline: true };
        }
      }
      return next;
    });
  };

  /* Headline değiştir — yalnızca pending dosyalar arasında */
  const setHeadline = (idx: number) => {
    setFiles((prev) => prev.map((f, i) => {
      if (f.kind === "saved") return { ...f, isHeadline: false };
      return { ...f, isHeadline: i === idx };
    }));
  };

  /* Saved dosyayı headline yap (önce eskisini sıfırla) */
  const setSavedHeadline = async (saved: SavedFile) => {
    // Eski headline'ı silmeden sadece state ve JSON'u güncelle
    setFiles((prev) => prev.map((f) =>
      f.kind === "saved"
        ? { ...f, isHeadline: f.path === saved.path }
        : { ...f, isHeadline: false }
    ));
    await fetch("/api/set-headline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, slug, filePath: saved.path }),
    });
  };

  const updateField = (idx: number, field: "name" | "alt", value: string) => {
    setFiles((prev) => prev.map((f, i) =>
      i === idx ? { ...f, [field]: value } : f
    ));
  };

  /* Pending dosyaları yükle */
  const handleUpload = async () => {
    const pending = files.filter((f): f is PendingFile => f.kind === "pending");
    if (pending.length === 0) {
      router.push(`/compose/${slug}/editor?type=${type}${isEdit ? "&edit=true" : ""}`);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      setProgress("Dosyalar hazırlanıyor...");
      const resized = await Promise.all(
        pending.map((pf) =>
          pf.file.type.startsWith("image/") ? resizeImage(pf.file) : Promise.resolve(pf.file)
        )
      );

      setProgress("Yükleniyor...");
      const formData = new FormData();
      formData.append("type", type);
      formData.append("slug", slug);

      // Headline önce
      const sorted = pending
        .map((pf, i) => ({ pf, resized: resized[i] }))
        .sort((a, b) => Number(b.pf.isHeadline) - Number(a.pf.isHeadline));

      formData.append("isHeadline", sorted[0]?.pf.isHeadline ? "true" : "false");
      formData.append(
        "fileMeta",
        JSON.stringify(sorted.map(({ pf }) => ({
          name: pf.name,
          alt: pf.alt,
          originalName: pf.file.name,
        })))
      );
      sorted.forEach(({ resized: r }) => formData.append("files", r));

      const res = await fetch("/api/upload-files", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      router.push(`/compose/${slug}/editor?type=${type}${isEdit ? "&edit=true" : ""}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const pendingCount = files.filter((f) => f.kind === "pending").length;
  const savedCount = files.filter((f) => f.kind === "saved").length;

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
        Yükleniyor...
      </div>
    );
  }

  return (
    <div>
      <StepIndicator current={2} slug={slug} type={type} isEdit={isEdit} />

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4 }}>
          {isEdit ? "Dosyaları Düzenle" : "Dosya Yükleme"}
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          {isEdit
            ? "Mevcut dosyaları silebilir, yeni dosya ekleyebilirsin."
            : "Resim ve PDF dosyalarını yükle. Bu adım isteğe bağlıdır."}
        </p>
      </div>

      {/* Mevcut (saved) dosyalar */}
      {savedCount > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 11, color: "var(--text-muted)", fontFamily: "DM Mono, monospace",
            marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em",
          }}>
            Mevcut Dosyalar ({savedCount})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {files
              .filter((f): f is SavedFile => f.kind === "saved")
              .map((f) => (
                <div key={f.path} style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr auto auto",
                  gap: 10, alignItems: "center",
                  padding: "10px 12px",
                  background: "var(--bg-card)",
                  border: `1px solid ${f.isHeadline ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "var(--radius-sm)",
                  opacity: deletingPath === f.path ? 0.5 : 1,
                  transition: "opacity .15s",
                }}>
                  {/* Thumbnail */}
                  <div style={{ width: 44, height: 44, borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
                    {isImage(f.path) ? (
                      <img
                        src={toProxyUrl(f.path)}
                        alt={f.alt}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%",
                        background: "var(--bg-input)",
                        display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 18,
                      }}>📄</div>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, marginBottom: 2 }}>
                      {f.alt || f.name}
                      {f.isHeadline && (
                        <span style={{
                          marginLeft: 8, fontSize: 10, padding: "1px 6px",
                          borderRadius: 10, background: "var(--accent-dim)",
                          color: "var(--accent)", border: "1px solid var(--accent)",
                        }}>kapak</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "DM Mono, monospace" }}>
                      {f.path.split("/").pop()}
                    </div>
                  </div>

                  {/* Headline toggle — sadece resimler için */}
                  {isImage(f.path) && !f.isHeadline && (
                    <button
                      onClick={() => setSavedHeadline(f)}
                      title="Kapak görseli yap"
                      style={{
                        width: 28, height: 28, borderRadius: 4,
                        border: "1px solid var(--border)", background: "transparent",
                        color: "var(--text-muted)", cursor: "pointer", fontSize: 13,
                      }}
                    >★</button>
                  )}
                  {f.isHeadline && <div style={{ width: 28 }} />}

                  {/* Sil */}
                  <button
                    onClick={() => deleteSaved(f)}
                    disabled={!!deletingPath}
                    title="Dosyayı sil"
                    style={{
                      width: 28, height: 28, borderRadius: 4,
                      border: "1px solid var(--border)", background: "transparent",
                      color: "var(--danger)", cursor: deletingPath ? "not-allowed" : "pointer",
                      fontSize: 15, opacity: deletingPath ? 0.5 : 1,
                    }}
                  >×</button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Drop zone — yeni dosya ekle */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
          borderRadius: "var(--radius)", padding: "24px 20px",
          textAlign: "center", cursor: "pointer",
          background: dragOver ? "var(--accent-dim)" : "transparent",
          transition: "all .15s", marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 6 }}>📁</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {isEdit ? "Yeni dosya ekle — " : ""}
          Sürükle veya <span style={{ color: "var(--accent)" }}>tıkla</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-subtle)", marginTop: 4 }}>
          JPG, PNG, WEBP, PDF — max {MAX_SIZE_MB}MB
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
          style={{ display: "none" }}
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Pending dosyalar listesi */}
      {pendingCount > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          <div style={{
            fontSize: 11, color: "var(--text-muted)", fontFamily: "DM Mono, monospace",
            textTransform: "uppercase", letterSpacing: "0.04em",
          }}>
            Yeni Eklenecek ({pendingCount})
          </div>
          {files
            .map((f, globalIdx) => ({ f, globalIdx }))
            .filter(({ f }) => f.kind === "pending")
            .map(({ f: anyFile, globalIdx }) => {
              const pf = anyFile as PendingFile;
              return (
                <div key={globalIdx} style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr 1fr auto auto",
                  gap: 10, alignItems: "center",
                  padding: "10px 12px",
                  background: "var(--bg-card)",
                  border: `1px solid ${pf.isHeadline ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "var(--radius-sm)",
                }}>
                  {/* Thumbnail */}
                  <div style={{ width: 44, height: 44, borderRadius: 4, overflow: "hidden" }}>
                    {pf.preview ? (
                      <img src={pf.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%", background: "var(--bg-input)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                      }}>📄</div>
                    )}
                  </div>

                  {/* Dosya adı */}
                  <div>
                    <label style={labelStyle}>Dosya adı</label>
                    <input
                      value={pf.name}
                      onChange={(e) => updateField(globalIdx, "name", e.target.value)}
                      style={{ ...inputStyle, fontFamily: "DM Mono, monospace", fontSize: 12 }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--border-focus)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                    />
                  </div>

                  {/* Alt */}
                  <div>
                    <label style={labelStyle}>Açıklama</label>
                    <input
                      value={pf.alt}
                      onChange={(e) => updateField(globalIdx, "alt", e.target.value)}
                      placeholder="Görsel açıklaması..."
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "var(--border-focus)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                    />
                  </div>

                  {/* Headline toggle */}
                  <button
                    onClick={() => setHeadline(globalIdx)}
                    title="Kapak görseli yap"
                    style={{
                      width: 28, height: 28, borderRadius: 4,
                      border: `1px solid ${pf.isHeadline ? "var(--accent)" : "var(--border)"}`,
                      background: pf.isHeadline ? "var(--accent-dim)" : "transparent",
                      color: pf.isHeadline ? "var(--accent)" : "var(--text-muted)",
                      cursor: "pointer", fontSize: 13,
                    }}
                  >★</button>

                  {/* Kaldır */}
                  <button
                    onClick={() => removePending(globalIdx)}
                    style={{
                      width: 28, height: 28, borderRadius: 4,
                      border: "1px solid var(--border)", background: "transparent",
                      color: "var(--text-muted)", cursor: "pointer", fontSize: 15,
                    }}
                  >×</button>
                </div>
              );
            })}
        </div>
      )}

      {error && (
        <div style={{
          padding: "10px 14px", background: "rgba(248,113,113,0.08)",
          border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius-sm)",
          color: "var(--danger)", fontSize: 13, marginBottom: 16,
        }}>{error}</div>
      )}

      {progress && (
        <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>
          ⏳ {progress}
        </div>
      )}

      {/* Aksiyon butonları */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={handleUpload}
          disabled={uploading}
          style={{
            padding: "10px 24px", borderRadius: "var(--radius-sm)",
            background: !uploading ? "var(--accent)" : "var(--bg-input)",
            color: !uploading ? "#fff" : "var(--text-muted)",
            border: "1px solid transparent", fontSize: 14, fontWeight: 500,
            cursor: !uploading ? "pointer" : "not-allowed",
            fontFamily: "inherit",
          }}
        >
          {uploading
            ? "Yükleniyor..."
            : pendingCount > 0
              ? `Yükle ve Devam → (${pendingCount} yeni)`
              : "Devam →"}
        </button>

        <button
          onClick={() => router.push(`/compose/${slug}/editor?type=${type}${isEdit ? "&edit=true" : ""}`)}
          disabled={uploading}
          style={{
            padding: "10px 16px", borderRadius: "var(--radius-sm)",
            background: "transparent", color: "var(--text-muted)",
            border: "1px solid var(--border)", fontSize: 14,
            cursor: uploading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {"Atla →"}
        </button>

        {isEdit && (
          <button
            onClick={() => router.push("/")}
            style={{
              marginLeft: "auto", padding: "10px 16px", borderRadius: "var(--radius-sm)",
              background: "transparent", color: "var(--text-muted)",
              border: "1px solid var(--border)", fontSize: 14,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            ← Ana Sayfa
          </button>
        )}
      </div>
    </div>
  );
}
