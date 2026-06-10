import { NextRequest, NextResponse } from "next/server";
import { readContent, upsertContent, getProjectPath } from "@/lib/fs-helpers";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { slug, filePath, isHeadline } = await req.json();

    const content = readContent(slug);
    if (!content) {
      return NextResponse.json({ success: false, error: "İçerik bulunamadı" }, { status: 404 });
    }

    // Diskten sil
    const absPath = path.join(getProjectPath(), "public", filePath);
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);

    if (isHeadline) {
      upsertContent({ ...content, headline_image: "" });
    } else {
      const updatedFiles = (content.files || []).filter((f) => f.path !== filePath);
      upsertContent({ ...content, files: updatedFiles });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
