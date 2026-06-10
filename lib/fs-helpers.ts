import fs from "fs";
import path from "path";
import { ContentMeta } from "./types";

export function getProjectPath(): string {
  const p = process.env.RAYFEL_PROJECT_PATH;
  if (!p) throw new Error("RAYFEL_PROJECT_PATH env variable is not set");
  return path.resolve(process.cwd(), p);
}

export function getDataDir(): string {
  return path.join(getProjectPath(), "data");
}

/** Tek veri dosyası: data/content-data.json */
export function getJsonPath(): string {
  return path.join(getDataDir(), "content-data.json");
}

/** uploads/[contentId]/ klasörü */
export function getUploadsDir(contentId: string): string {
  return path.join(getProjectPath(), "public", "uploads", contentId);
}

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

/** Tüm içerikleri oku */
export function readAllContents(): ContentMeta[] {
  try {
    const raw = fs.readFileSync(getJsonPath(), "utf-8");
    return JSON.parse(raw) as ContentMeta[];
  } catch {
    return [];
  }
}

/** type'a göre filtreli içerikler */
export function readContentsByType(type: string): ContentMeta[] {
  return readAllContents().filter((c) => c.type === type);
}

/** Slug ile içerik bul */
export function readContent(slug: string): ContentMeta | null {
  return readAllContents().find((c) => c.slug === slug) ?? null;
}

/** id ile içerik bul */
export function readContentById(id: string): ContentMeta | null {
  return readAllContents().find((c) => c.id === id) ?? null;
}

/** Tüm array'i diske yaz */
export function writeAllContents(contents: ContentMeta[]): void {
  ensureDir(getDataDir());
  fs.writeFileSync(getJsonPath(), JSON.stringify(contents, null, 2), "utf-8");
}

/** Upsert — slug bazlı */
export function upsertContent(updated: ContentMeta): void {
  const all = readAllContents();
  const idx = all.findIndex((c) => c.slug === updated.slug);
  if (idx >= 0) {
    all[idx] = updated;
  } else {
    all.push(updated);
  }
  writeAllContents(all);
}

/** Slug ile sil */
export function removeContent(slug: string): void {
  writeAllContents(readAllContents().filter((c) => c.slug !== slug));
}

/** Tüm slug listesi */
export function getAllSlugs(): string[] {
  return readAllContents().map((c) => c.slug);
}

/** uploads/[contentId]/ klasöründe aynı isimde dosya var mı? */
export function fileExistsInUploads(contentId: string, fileName: string): boolean {
  const filePath = path.join(getUploadsDir(contentId), fileName);
  return fs.existsSync(filePath);
}
