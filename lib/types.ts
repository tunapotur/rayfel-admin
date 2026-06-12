export type ContentType = "news" | "announcement";
export type NewsType = "news" | "mobility" | "dissemination";
export type LanguageType = "tr" | "en" | "de";

export interface FileItem {
  id: string;        // "news-2026-06-10_13-54-44-123" formatında unique id
  name: string;
  alt: string;
  path: string;      // "/uploads/[contentId]/dosya.jpg"
}

export interface ContentMeta {
  id: string;        // "news-2026-06-10_13-54-44-123" formatında unique id
  type: ContentType;
  newsType?: NewsType;
  title: string;
  description: string;
  language: LanguageType;
  date: string;
  slug: string;
  headline_image?: string;
  mainText: string;
  files: FileItem[];
}
