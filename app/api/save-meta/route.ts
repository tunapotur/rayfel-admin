import { NextRequest, NextResponse } from "next/server";
import { upsertContent, readContent, getNextId } from "@/lib/fs-helpers";
import { ContentMeta } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { type, newsType, title, description, language, date, slug, isEdit } = await req.json();

    let meta: ContentMeta;

    if (isEdit) {
      // Edit modunda: mevcut içeriği yükle, sadece meta alanlarını güncelle
      const existing = readContent(type, slug);
      if (!existing) {
        return NextResponse.json({ success: false, error: "İçerik bulunamadı" }, { status: 404 });
      }
      meta = {
        ...existing, // id, mainText, files, headline_image korunur
        type,
        ...(type === "news" && newsType ? { newsType } : { newsType: undefined }),
        title,
        description,
        language,
        date,
        slug,
      };
    } else {
      // Yeni içerik
      const id = getNextId(type);
      meta = {
        id,
        type,
        ...(type === "news" && newsType ? { newsType } : {}),
        title,
        description,
        language,
        date,
        slug,
        headline_image: "",
        mainText: "",
        files: [],
      };
    }

    upsertContent(type, meta);

    return NextResponse.json({ success: true, slug });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
