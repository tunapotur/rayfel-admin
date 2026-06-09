import { NextRequest, NextResponse } from "next/server";
import { readContent } from "@/lib/fs-helpers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");

  if (!type || !slug) {
    return NextResponse.json({ success: false, error: "type ve slug gerekli" }, { status: 400 });
  }

  const content = readContent(type, slug);
  if (!content) {
    return NextResponse.json({ success: false, error: "İçerik bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    files: content.files || [],
    headline_image: content.headline_image || "",
    mainText: content.mainText || "",
  });
}
