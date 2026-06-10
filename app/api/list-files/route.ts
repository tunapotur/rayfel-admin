import { NextRequest, NextResponse } from "next/server";
import { readContent } from "@/lib/fs-helpers";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ success: false, error: "slug gerekli" }, { status: 400 });
  }

  const content = readContent(slug);
  if (!content) {
    return NextResponse.json({ success: false, error: "İçerik bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    contentId: content.id,
    title: content.title,
    description: content.description,
    language: content.language,
    date: content.date,
    newsType: content.newsType,
    files: content.files || [],
    headline_image: content.headline_image || "",
    mainText: content.mainText || "",
  });
}
