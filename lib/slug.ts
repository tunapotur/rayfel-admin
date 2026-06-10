import slugify from "slugify";

export function generateSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    locale: "tr",
    replacement: "-",
    trim: true,
  });
}

export function formatDateTR(dateStr: string): string {
  // dateStr: "2024-07-12" → "12 Temmuz 2024"
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
  ];
  const [year, month, day] = dateStr.split("-");
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

/** "12 Temmuz 2024" → "2024-07-12" (date input için) */
export function parseDateTR(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  // Zaten ISO formatındaysa direkt döndür
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const months: Record<string, string> = {
    "Ocak": "01", "Şubat": "02", "Mart": "03", "Nisan": "04",
    "Mayıs": "05", "Haziran": "06", "Temmuz": "07", "Ağustos": "08",
    "Eylül": "09", "Ekim": "10", "Kasım": "11", "Aralık": "12",
  };
  const parts = dateStr.trim().split(" ");
  if (parts.length !== 3) return new Date().toISOString().split("T")[0];
  const [day, monthName, year] = parts;
  const month = months[monthName];
  if (!month) return new Date().toISOString().split("T")[0];
  return `${year}-${month}-${day.padStart(2, "0")}`;
}
