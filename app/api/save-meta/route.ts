import { NextRequest, NextResponse } from "next/server";
import { upsertContent, readContent, removeContent, getUploadsDir } from "@/lib/fs-helpers";
import { generateContentId } from "@/lib/id";
import { ContentMeta } from "@/lib/types";
import fs from "fs";

export async function POST(req: NextRequest) {
  try {
    const { type, newsType, title, description, language, date, slug, isEdit, originalSlug } = await req.json();

    let meta: ContentMeta;

    if (isEdit) {
      const lookupSlug = originalSlug || slug;
      const existing = readContent(lookupSlug);

      if (!existing) {
        return NextResponse.json(
          { success: false, error: `İçerik bulunamadı: slug=${lookupSlug}` },
          { status: 404 }
        );
      }

      const slugChanged = slug !== lookupSlug;

      if (slugChanged) {
        removeContent(lookupSlug);
        // uploads klasörünü taşı — klasör adı contentId olduğu için değişmez, sadece JSON güncellenir
        // (contentId slug değil, timestamp tabanlı — klasör adı zaten sabit)
      }

      meta = {
        ...existing,
        type,
        ...(type === "news" && newsType ? { newsType } : { newsType: undefined }),
        title,
        description,
        language,
        date,
        slug,
        // id, headline_image, files, mainText korunur
      };
    } else {
      // Yeni içerik — ID timestamp ile üret
      const id = generateContentId(type);
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

    upsertContent(meta);
    return NextResponse.json({ success: true, slug, contentId: meta.id });
  } catch (err) {
    console.error("[save-meta]", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
