export type ContentType = "news" | "announcements";
export type NewsType = "news" | "mobility" | "dissemination";
export type LanguageType = "tr" | "en" | "de";

export interface FileItem {
  id: number;
  name: string;
  alt: string;
  path: string;
  originalName: string;
}

export interface ContentMeta {
  id: number;
  type: ContentType;
  newsType?: NewsType; // only for news
  title: string;
  description: string;
  language: LanguageType;
  date: string;
  slug: string;
  headline_image?: string;
  mainText: string; // Quill HTML
  files: FileItem[];
}
