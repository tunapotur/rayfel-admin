/**
 * İçerik ve dosya için unique ID üretir.
 * Format: {type}-{yil}-{ay}-{gun}_{saat}-{dakika}-{saniye}-{milisaniye}
 * Örnek: news-2026-06-10_13-54-44-123
 */
export function generateContentId(type: string): string {
  const now = new Date();
  const yil = now.getFullYear();
  const ay = String(now.getMonth() + 1).padStart(2, "0");
  const gun = String(now.getDate()).padStart(2, "0");
  const saat = String(now.getHours()).padStart(2, "0");
  const dakika = String(now.getMinutes()).padStart(2, "0");
  const saniye = String(now.getSeconds()).padStart(2, "0");
  const milisaniye = String(now.getMilliseconds()).padStart(3, "0");
  return `${type}-${yil}-${ay}-${gun}_${saat}-${dakika}-${saniye}-${milisaniye}`;
}

// Aynı süreçte birden fazla çağrıda çakışmayı önlemek için sayaç
let fileIdCounter = 0;

/**
 * Dosya için unique ID üretir.
 * Aynı milisaniyede birden fazla çağrılsa bile sayaç ile unique kalır.
 */
export function generateFileId(): string {
  const now = new Date();
  const yil = now.getFullYear();
  const ay = String(now.getMonth() + 1).padStart(2, "0");
  const gun = String(now.getDate()).padStart(2, "0");
  const saat = String(now.getHours()).padStart(2, "0");
  const dakika = String(now.getMinutes()).padStart(2, "0");
  const saniye = String(now.getSeconds()).padStart(2, "0");
  const milisaniye = String(now.getMilliseconds()).padStart(3, "0");
  const seq = String(fileIdCounter++).padStart(3, "0");
  return `file-${yil}-${ay}-${gun}_${saat}-${dakika}-${saniye}-${milisaniye}-${seq}`;
}