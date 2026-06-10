import { NextRequest, NextResponse } from "next/server";
import { readContent, upsertContent } from "@/lib/fs-helpers";

export async function POST(req: NextRequest) {
  try {
    const { slug, filePath } = await req.json();
    const content = readContent(slug);
    if (!content) {
      return NextResponse.json({ success: false, error: "İçerik bulunamadı" }, { status: 404 });
    }
    upsertContent({ ...content, headline_image: filePath });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
