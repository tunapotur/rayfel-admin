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

/** data/news.json veya data/announcements.json */
export function getJsonPath(type: string): string {
  return path.join(getDataDir(), `${type}.json`);
}

export function getUploadsDir(slug: string): string {
  return path.join(getProjectPath(), "public", "uploads", slug);
}

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

/** Tüm içerikleri oku (type = "news" | "announcements") */
export function readAllContents(type: string): ContentMeta[] {
  try {
    const raw = fs.readFileSync(getJsonPath(type), "utf-8");
    return JSON.parse(raw) as ContentMeta[];
  } catch {
    return [];
  }
}

/** Tek bir slug'a ait içeriği oku */
export function readContent(type: string, slug: string): ContentMeta | null {
  const all = readAllContents(type);
  return all.find((c) => c.slug === slug) ?? null;
}

/** Tüm array'i diske yaz */
export function writeAllContents(type: string, contents: ContentMeta[]): void {
  ensureDir(getDataDir());
  fs.writeFileSync(getJsonPath(type), JSON.stringify(contents, null, 2), "utf-8");
}

/** Tek bir içeriği ekle veya güncelle (slug bazlı upsert) */
export function upsertContent(type: string, updated: ContentMeta): void {
  const all = readAllContents(type);
  const idx = all.findIndex((c) => c.slug === updated.slug);
  if (idx >= 0) {
    all[idx] = updated;
  } else {
    all.push(updated);
  }
  writeAllContents(type, all);
}

/** Sonraki id'yi hesapla */
export function getNextId(type: string): number {
  const all = readAllContents(type);
  if (all.length === 0) return 0;
  return Math.max(...all.map((c) => c.id ?? 0)) + 1;
}

/** Tüm slug'ları döndür */
export function getAllSlugs(type: string): string[] {
  return readAllContents(type).map((c) => c.slug);
}
