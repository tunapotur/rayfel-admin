import { NextRequest, NextResponse } from "next/server";
import { readContent, upsertContent } from "@/lib/fs-helpers";

export async function POST(req: NextRequest) {
  try {
    const { slug, mainText } = await req.json();

    const content = readContent(slug);
    if (!content) {
      return NextResponse.json({ success: false, error: "İçerik bulunamadı" }, { status: 404 });
    }

    upsertContent({ ...content, mainText });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
