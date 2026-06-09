"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "./StepIndicator";

interface FileMeta {
  file: File;
  name: string;   // kullanıcının verdiği isim (dosyaya yazılacak)
  alt: string;    // açıklayıcı metin
  preview?: string;
  isHeadline: boolean;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px",
  background: "var(--bg)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)", color: "var(--text)",
  fontSize: 13, outline: "none", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 500,
  color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const MAX_SIZE_MB = 10;

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
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return; }
        const ext = file.name.endsWith(".png") ? "png" : "jpeg";
        resolve(new File([blob], file.name, { type: `image/${ext}` }));
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

interface FileUploaderProps {
  slug: string;
  type: string;
}

export default function FileUploader({ slug, type }: FileUploaderProps) {
  const router = useRouter();
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const valid = arr.filter(f => {
      if (!ALLOWED_TYPES.includes(f.type)) return false;
      if (f.size > MAX_SIZE_MB * 1024 * 1024) return false;
      return true;
    });

    const newMetas: FileMeta[] = valid.map((f, i) => {
      const isFirst = files.length === 0 && i === 0;
      const safeName = slugifyFileName(f.name);
      return {
        file: f,
        name: safeName,
        alt: "",
        preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
        isHeadline: isFirst,
      };
    });
    setFiles(prev => [...prev, ...newMetas]);
  }, [files.length]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (i: number) => {
    setFiles(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      // Eğer headline kaldırıldıysa ilkini headline yap
      if (prev[i].isHeadline && next.length > 0) {
        next[0] = { ...next[0], isHeadline: true };
      }
      return next;
    });
  };

  const setHeadline = (i: number) => {
    setFiles(prev => prev.map((f, idx) => ({ ...f, isHeadline: idx === i })));
  };

  const updateField = (i: number, field: "name" | "alt", value: string) => {
    setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f));
  };

  const handleUpload = async () => {
    setUploading(true); setError(null);
    try {
      // Resimleri önce resize et
      setUploadProgress("Dosyalar hazırlanıyor...");
      const resized: File[] = await Promise.all(
        files.map(fm => fm.file.type.startsWith("image/") ? resizeImage(fm.file) : Promise.resolve(fm.file))
      );

      setUploadProgress("Yükleniyor...");
      const formData = new FormData();
      formData.append("type", type);
      formData.append("slug", slug);

      // Headline'ı ilk sıraya al
      const sorted = files.map((fm, i) => ({ fm, resized: resized[i] }))
        .sort((a, b) => (b.fm.isHeadline ? 1 : 0) - (a.fm.isHeadline ? 1 : 0));

      formData.append("isHeadline", sorted[0]?.fm.isHeadline ? "true" : "false");

      const metaArr = sorted.map(({ fm }) => ({
        name: fm.name,
        alt: fm.alt,
        originalName: fm.file.name,
      }));
      formData.append("fileMeta", JSON.stringify(metaArr));

      sorted.forEach(({ resized: r }) => formData.append("files", r));

      const res = await fetch("/api/upload-files", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      router.push(`/compose/${slug}/editor?type=${type}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const headlineFile = files.find(f => f.isHeadline);

  return (
    <div>
      <StepIndicator current={2} slug={slug} type={type} />

      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4 }}>
          Dosya Yükleme
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Resim ve PDF dosyalarını yükle. Bu adım isteğe bağlıdır.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
          borderRadius: "var(--radius)", padding: "32px 20px",
          textAlign: "center", cursor: "pointer",
          background: dragOver ? "var(--accent-dim)" : "transparent",
          transition: "all .15s", marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Dosyaları buraya sürükle veya <span style={{ color: "var(--accent)" }}>tıkla</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 6 }}>
          JPG, PNG, WEBP, PDF — max {MAX_SIZE_MB}MB
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
          style={{ display: "none" }}
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "DM Mono, monospace" }}>
            {files.length} dosya — Kapak görseli için ★ işaretle
          </div>
          {files.map((fm, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "40px 1fr 1fr auto auto",
              gap: 10, alignItems: "center",
              padding: "12px 14px", background: "var(--bg-card)",
              border: `1px solid ${fm.isHeadline ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "var(--radius-sm)",
            }}>
              {/* Thumbnail */}
              <div style={{ width: 40, height: 40, borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
                {fm.preview ? (
                  <img src={fm.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    📄
                  </div>
                )}
              </div>

              {/* Name input */}
              <div>
                <label style={labelStyle}>Dosya adı</label>
                <input value={fm.name} onChange={e => updateField(i, "name", e.target.value)}
                  placeholder={fm.file.name}
                  style={{ ...inputStyle, fontFamily: "DM Mono, monospace", fontSize: 12 }}
                  onFocus={e => (e.target.style.borderColor = "var(--border-focus)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Alt input */}
              <div>
                <label style={labelStyle}>Açıklama (alt)</label>
                <input value={fm.alt} onChange={e => updateField(i, "alt", e.target.value)}
                  placeholder="Görsel açıklaması..."
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "var(--border-focus)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Headline toggle */}
              <button
                onClick={() => setHeadline(i)}
                title="Kapak görseli yap"
                style={{
                  width: 28, height: 28, borderRadius: 4,
                  border: `1px solid ${fm.isHeadline ? "var(--accent)" : "var(--border)"}`,
                  background: fm.isHeadline ? "var(--accent-dim)" : "transparent",
                  color: fm.isHeadline ? "var(--accent)" : "var(--text-muted)",
                  cursor: "pointer", fontSize: 14,
                }}
              >★</button>

              {/* Remove */}
              <button
                onClick={() => removeFile(i)}
                style={{
                  width: 28, height: 28, borderRadius: 4,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--text-muted)", cursor: "pointer", fontSize: 14,
                }}
              >×</button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{
          padding: "10px 14px", background: "rgba(248,113,113,0.08)",
          border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius-sm)",
          color: "var(--danger)", fontSize: 13, marginBottom: 20,
        }}>{error}</div>
      )}

      {uploadProgress && (
        <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
          ⏳ {uploadProgress}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          style={{
            padding: "10px 24px", borderRadius: "var(--radius-sm)",
            background: files.length > 0 && !uploading ? "var(--accent)" : "var(--bg-input)",
            color: files.length > 0 && !uploading ? "#fff" : "var(--text-muted)",
            border: "1px solid transparent", fontSize: 14, fontWeight: 500,
            cursor: files.length > 0 && !uploading ? "pointer" : "not-allowed",
            fontFamily: "inherit",
          }}
        >
          {uploading ? "Yükleniyor..." : "Yükle ve Devam →"}
        </button>
        <button
          onClick={() => router.push(`/compose/${slug}/editor?type=${type}`)}
          disabled={uploading}
          style={{
            padding: "10px 20px", borderRadius: "var(--radius-sm)",
            background: "transparent", color: "var(--text-muted)",
            border: "1px solid var(--border)", fontSize: 14,
            cursor: uploading ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}
        >
          Atla →
        </button>
      </div>
    </div>
  );
}
