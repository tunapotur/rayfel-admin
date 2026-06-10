import { NextRequest, NextResponse } from "next/server";
import { readContent, upsertContent, getProjectPath } from "@/lib/fs-helpers";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { type, slug, filePath, isHeadline } = await req.json();

    const content = readContent(type, slug);
    if (!content) {
      return NextResponse.json({ success: false, error: "İçerik bulunamadı" }, { status: 404 });
    }

    // Diskten sil
    const absPath = path.join(getProjectPath(), "public", filePath);
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
    }

    // JSON'dan güncelle
    if (isHeadline) {
      upsertContent(type, { ...content, headline_image: "" });
    } else {
      const updatedFiles = (content.files || []).filter((f) => f.path !== filePath);
      const reindexed = updatedFiles.map((f, i) => ({ ...f, id: i }));
      upsertContent(type, { ...content, files: reindexed });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
