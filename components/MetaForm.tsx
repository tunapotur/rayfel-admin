"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "./StepIndicator";
import { generateSlug, formatDateTR, parseDateTR } from "@/lib/slug";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: "var(--bg-input)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)", color: "var(--text)",
  fontSize: 14, outline: "none", fontFamily: "inherit",
  transition: "border-color .15s",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 500,
  color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase",
  letterSpacing: "0.04em",
};

interface MetaFormProps {
  slug?: string;   // edit modunda dolu gelir
  type?: string;   // edit modunda dolu gelir
  isEdit?: boolean;
}

export default function MetaForm({ slug: initialSlug, type: initialType, isEdit }: MetaFormProps) {
  const router = useRouter();

  const [type, setType] = useState<"news" | "announcements">((initialType as "news" | "announcements") || "news");
  const [newsType, setNewsType] = useState<"news" | "mobility" | "dissemination">("news");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState(initialSlug || "");
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState<"tr" | "en" | "de">("tr");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loaded, setLoaded] = useState(!isEdit); // yeni içerikte hemen hazır

  const [slugConflict, setSlugConflict] = useState<string | null>(null);
  const [titleConflict, setTitleConflict] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit modunda mevcut veriyi çek
  useEffect(() => {
    if (!isEdit || !initialSlug || !initialType) return;
    fetch(`/api/list-files?slug=${initialSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;
        setTitle(data.title || "");
        setDescription(data.description || "");
        setLanguage(data.language || "tr");
        setDate(parseDateTR(data.date));
        if (data.newsType) setNewsType(data.newsType);
        setLoaded(true);
      });
  }, [isEdit, initialSlug, initialType]);

  // Auto-slug — yeni içerikte ve edit modunda başlık değişince
  useEffect(() => {
    if (!slugManual && title) {
      setSlug(generateSlug(title));
    }
  }, [title, slugManual]);

  // Conflict check (debounced) — edit modunda slug değişmediği için sadece başlık kontrol et
  useEffect(() => {
    if (!slug || !title) { setSlugConflict(null); setTitleConflict(null); return; }

    setChecking(true);
    const t = setTimeout(async () => {
      const res = await fetch("/api/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title, type, originalSlug: isEdit ? initialSlug : undefined }),
      });
      const data = await res.json();
      setSlugConflict(data.conflict === "slug" ? data.message : null);
      setTitleConflict(data.conflict === "title" ? data.message : null);
      setChecking(false);
    }, 500);
    return () => clearTimeout(t);
  }, [slug, title, type, isEdit]);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !slug || !date) return;
    if (slugConflict || titleConflict) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/save-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          newsType: type === "news" ? newsType : undefined,
          title: title.trim(),
          description: description.trim(),
          language,
          date: formatDateTR(date),
          slug,
          isEdit: isEdit || false,
          originalSlug: isEdit ? initialSlug : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      router.push(`/compose/${slug}/files?type=${type}${isEdit ? "&edit=true" : ""}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const hasConflict = !!(slugConflict || titleConflict);
  const isReady = loaded && title.trim().length > 0 && description.trim().length > 0 &&
    slug.length > 0 && date && !hasConflict && !checking;

  if (!loaded) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
        Yükleniyor...
      </div>
    );
  }

  return (
    <div>
      <StepIndicator current={1} slug={slug} type={type} isEdit={isEdit} />

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4 }}>
          {isEdit ? "Meta Bilgileri Düzenle" : "Meta Bilgiler"}
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          {isEdit
            ? "Başlık, açıklama, tarih ve dil bilgilerini güncelleyebilirsin."
            : "İçeriğin temel bilgilerini gir. Slug otomatik oluşturulur."}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Type row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>İçerik Tipi</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              disabled={isEdit}
              style={{ ...inputStyle, cursor: isEdit ? "not-allowed" : "pointer", opacity: isEdit ? 0.5 : 1 }}
            >
              <option value="news">Haber</option>
              <option value="announcements">Duyuru</option>
            </select>
          </div>
          {type === "news" && (
            <div>
              <label style={labelStyle}>Haber Kategorisi</label>
              <select value={newsType} onChange={(e) => setNewsType(e.target.value as typeof newsType)}
                style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="news">Haber</option>
                <option value="mobility">Hareketlilik</option>
                <option value="dissemination">Yaygınlaştırma</option>
              </select>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label style={labelStyle}>
            Başlık
            <span style={{ color: title.length > 128 ? "var(--danger)" : "var(--text-subtle)", marginLeft: 8, fontWeight: 400 }}>
              {title.length}/128
            </span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={128}
            placeholder="İçerik başlığı..."
            style={{ ...inputStyle, borderColor: titleConflict ? "var(--danger)" : "var(--border)" }}
            onFocus={(e) => (e.target.style.borderColor = titleConflict ? "var(--danger)" : "var(--border-focus)")}
            onBlur={(e) => (e.target.style.borderColor = titleConflict ? "var(--danger)" : "var(--border)")}
          />
          {titleConflict && (
            <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 5 }}>⚠ {titleConflict}</div>
          )}
        </div>

        {/* Slug — edit modunda readonly */}
        <div>
          <label style={labelStyle}>
            Slug
            {!isEdit && slugManual && (
              <button onClick={() => { setSlugManual(false); setSlug(generateSlug(title)); }}
                style={{ marginLeft: 8, fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>
                ↺ Sıfırla
              </button>
            )}

          </label>
          <div style={{ position: "relative" }}>
            <input
              value={slug}
              onChange={(e) => { setSlugManual(true); setSlug(e.target.value); }}

              placeholder="otomatik-olusturulur"
              style={{
                ...inputStyle,
                fontFamily: "DM Mono, monospace",
                fontSize: 13,
                borderColor: slugConflict ? "var(--danger)" : "var(--border)",
                paddingRight: 60,

              }}
              onFocus={(e) => (e.target.style.borderColor = slugConflict ? "var(--danger)" : "var(--border-focus)")}
              onBlur={(e) => { e.target.style.borderColor = slugConflict ? "var(--danger)" : "var(--border)"; }}
            />
            {!isEdit && (
              <div style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                fontSize: 11, color: checking ? "var(--text-muted)" : slugConflict ? "var(--danger)" : slug ? "var(--success)" : "var(--text-subtle)",
              }}>
                {checking ? "•••" : slugConflict ? "✗" : slug ? "✓" : ""}
              </div>
            )}
          </div>
          {slugConflict && (
            <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 5 }}>⚠ {slugConflict}</div>
          )}
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>
            Kısa Açıklama
            <span style={{ color: description.length > 512 ? "var(--danger)" : "var(--text-subtle)", marginLeft: 8, fontWeight: 400 }}>
              {description.length}/512
            </span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={512}
            rows={3}
            placeholder="Kartlarda görünecek kısa açıklama..."
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            onFocus={(e) => (e.target.style.borderColor = "var(--border-focus)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Date + Language */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Tarih</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ ...inputStyle, colorScheme: "dark" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--border-focus)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
          <div>
            <label style={labelStyle}>Dil</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value as typeof language)}
              style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>

        {error && (
          <div style={{
            padding: "10px 14px", background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius-sm)",
            color: "var(--danger)", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 8 }}>
          <button
            onClick={handleSubmit}
            disabled={!isReady || saving}
            style={{
              padding: "10px 24px", borderRadius: "var(--radius-sm)",
              background: isReady && !saving ? "var(--accent)" : "var(--bg-input)",
              color: isReady && !saving ? "#fff" : "var(--text-muted)",
              border: "1px solid transparent",
              fontSize: 14, fontWeight: 500,
              cursor: isReady && !saving ? "pointer" : "not-allowed",
              fontFamily: "inherit", transition: "all .15s",
            }}
          >
            {saving ? "Kaydediliyor..." : isEdit ? "Kaydet ve Devam →" : "Devam →"}
          </button>

          {isEdit && (
            <button
              onClick={() => router.push("/")}
              style={{
                padding: "10px 16px", borderRadius: "var(--radius-sm)",
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
    </div>
  );
}
