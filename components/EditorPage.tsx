"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import StepIndicator from "./StepIndicator";
import { FileItem } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false }) as any;

interface EditorPageProps {
  slug: string;
  type: string;
}

interface QuillInstance {
  getEditor: () => {
    getSelection: (focus?: boolean) => { index: number; length: number } | null;
    insertEmbed: (index: number, type: string, value: string) => void;
    getModule: (name: string) => { addHandler: (event: string, handler: () => void) => void };
  };
}

/** Ana projedeki /uploads/... path'ini admin proxy URL'ine çevirir */
function toProxyUrl(publicPath: string): string {
  // publicPath: "/uploads/slug/file.jpg"
  return `/api/proxy-image?path=${encodeURIComponent(publicPath)}`;
}

/** Quill içeriğindeki img src'lerini proxy URL → orijinal path'e çevirir (kaydetmeden önce) */
function proxyUrlsToPublicPaths(html: string): string {
  return html.replace(
    /src="\/api\/proxy-image\?path=([^"]+)"/g,
    (_, encoded) => `src="${decodeURIComponent(encoded)}"`
  );
}

/** Kaydedilmiş içerikteki orijinal path'leri proxy URL'e çevirir (editörde göstermek için) */
function publicPathsToProxyUrls(html: string): string {
  return html.replace(
    /src="(\/uploads\/[^"]+)"/g,
    (_, p) => `src="${toProxyUrl(p)}"`
  );
}

const quillFormats = [
  "header", "bold", "italic", "underline",
  "list", "blockquote", "code-block", "link", "image",
];

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 500,
  color: "var(--text-muted)", marginBottom: 4,
  textTransform: "uppercase", letterSpacing: "0.04em",
};

export default function EditorPage({ slug, type }: EditorPageProps) {
  const router = useRouter();
  const quillRef = useRef<QuillInstance | null>(null);

  // Quill'de gösterilen HTML (proxy URL'leriyle)
  const [editorHtml, setEditorHtml] = useState("");
  // Dosyaya yazılacak gerçek HTML (orijinal path'lerle) — editorHtml'den türetilir
  const [files, setFiles] = useState<FileItem[]>([]);
  const [headlineImage, setHeadlineImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilePanel, setShowFilePanel] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Mevcut içeriği yükle
  useEffect(() => {
    fetch(`/api/list-files?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setFiles(data.files || []);
          setHeadlineImage(data.headline_image || "");
          // Kaydedilmiş HTML'deki orijinal path'leri proxy URL'e çevir
          setEditorHtml(publicPathsToProxyUrls(data.mainText || ""));
        }
        setLoading(false);
      });
  }, [slug, type]);

  // Resim eklemek için Quill toolbar handler override
  const setupImageHandler = useCallback(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const toolbar = editor.getModule("toolbar");
    toolbar.addHandler("image", () => {
      setShowImagePicker(true);
    });
  }, []);

  // Quill yüklenince handler'ı kur
  useEffect(() => {
    const timer = setTimeout(setupImageHandler, 500);
    return () => clearTimeout(timer);
  }, [setupImageHandler, loading]);

  const insertImage = (publicPath: string) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const range = editor.getSelection(true);
    const idx = range ? range.index : 0;
    // Editörde proxy URL ile göster
    editor.insertEmbed(idx, "image", toProxyUrl(publicPath));
    setShowImagePicker(false);
  };

  const insertFileLink = (filePath: string, fileName: string) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const range = editor.getSelection(true);
    const idx = range ? range.index : 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor as any).insertText(idx, fileName, "link", filePath);
    setShowImagePicker(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // Proxy URL'lerini orijinal path'lere çevirerek kaydet
      const cleanHtml = proxyUrlsToPublicPaths(editorHtml);
      const res = await fetch("/api/save-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, mainText: cleanHtml }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const allImages = [
    ...(headlineImage ? [{ path: headlineImage, alt: "Kapak Görseli", name: "headline" }] : []),
    ...files.filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.path)).map((f) => ({
      path: f.path, alt: f.alt, name: f.name,
    })),
  ];

  const allDocs = files.filter((f) => /\.pdf$/i.test(f.path));

  const quillModules = {
    toolbar: {
      container: [
        [{ header: [2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "code-block"],
        ["link", "image"],
        ["clean"],
      ],
    },
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
        Yükleniyor...
      </div>
    );
  }

  return (
    <div>
      <StepIndicator current={3} slug={slug} type={type} />

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4 }}>
          İçerik Editörü
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Haberin ana metnini yaz.{" "}
          {allImages.length > 0 && "Araç çubuğundaki 🖼 butonuyla yüklü resimleri ekleyebilirsin."}
        </p>
      </div>

      {/* Yüklü dosyalar özet */}
      {(allImages.length > 0 || allDocs.length > 0) && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowFilePanel((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 12px", borderRadius: "var(--radius-sm)",
              background: showFilePanel ? "var(--accent-dim)" : "var(--bg-card)",
              border: `1px solid ${showFilePanel ? "var(--accent)" : "var(--border)"}`,
              color: showFilePanel ? "var(--accent)" : "var(--text-muted)",
              fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <span>📎</span>
            <span>
              Yüklü Dosyalar ({allImages.length + allDocs.length})
            </span>
            <span>{showFilePanel ? "▲" : "▼"}</span>
          </button>

          {showFilePanel && (
            <div style={{
              marginTop: 8, padding: "12px 14px",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
            }}>
              {allImages.length > 0 && (
                <div style={{ marginBottom: allDocs.length > 0 ? 12 : 0 }}>
                  <div style={labelStyle}>Resimler</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                    {allImages.map((img) => (
                      <button
                        key={img.path}
                        onClick={() => insertImage(img.path)}
                        title={`Ekle: ${img.alt}`}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center",
                          gap: 4, padding: 6, borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border)", background: "var(--bg-input)",
                          cursor: "pointer", width: 80,
                        }}
                      >
                        <img
                          src={toProxyUrl(img.path)}
                          alt={img.alt}
                          style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 3 }}
                        />
                        <span style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.2, wordBreak: "break-all" }}>
                          {img.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {allDocs.length > 0 && (
                <div>
                  <div style={labelStyle}>Dökümanlar</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                    {allDocs.map((doc) => (
                      <button
                        key={doc.path}
                        onClick={() => insertFileLink(doc.path, doc.alt || doc.name)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "6px 10px", borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border)", background: "var(--bg-input)",
                          cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                        }}
                      >
                        <span>📄</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {doc.alt || doc.name}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-subtle)", marginLeft: "auto" }}>
                          Link olarak ekle
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quill editor */}
      <div style={{ marginBottom: 16 }}>
        <ReactQuill
          ref={quillRef}
          value={editorHtml}
          onChange={setEditorHtml}
          modules={quillModules}
          formats={quillFormats}
          placeholder="Haberin ana metni..."
          theme="snow"
        />
      </div>

      {/* Karakter sayacı */}
      <div style={{
        fontSize: 11, color: "var(--text-subtle)",
        marginBottom: 20, fontFamily: "DM Mono, monospace",
      }}>
        {editorHtml.replace(/<[^>]+>/g, "").length} karakter
      </div>

      {error && (
        <div style={{
          padding: "10px 14px", background: "rgba(248,113,113,0.08)",
          border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius-sm)",
          color: "var(--danger)", fontSize: 13, marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* Aksiyon butonları */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={handleSave}
          disabled={saving || !editorHtml.replace(/<[^>]+>/g, "").trim()}
          style={{
            padding: "10px 24px", borderRadius: "var(--radius-sm)",
            background:
              !saving && editorHtml.replace(/<[^>]+>/g, "").trim()
                ? "var(--accent)"
                : "var(--bg-input)",
            color:
              !saving && editorHtml.replace(/<[^>]+>/g, "").trim()
                ? "#fff"
                : "var(--text-muted)",
            border: "1px solid transparent",
            fontSize: 14, fontWeight: 500,
            cursor:
              !saving && editorHtml.replace(/<[^>]+>/g, "").trim()
                ? "pointer"
                : "not-allowed",
            fontFamily: "inherit",
          }}
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>

        {saved && (
          <span style={{ color: "var(--success)", fontSize: 13 }}>✓ Kaydedildi</span>
        )}

        <button
          onClick={() => router.push("/")}
          style={{
            marginLeft: "auto", padding: "10px 16px",
            borderRadius: "var(--radius-sm)", background: "transparent",
            color: "var(--text-muted)", border: "1px solid var(--border)",
            fontSize: 14, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          ← Ana Sayfa
        </button>
      </div>

      {/* Quill CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/react-quill-new@latest/dist/quill.snow.css"
      />
    </div>
  );
}
