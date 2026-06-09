import { NextRequest, NextResponse } from "next/server";
import { upsertContent, readContent, ensureDir, getUploadsDir } from "@/lib/fs-helpers";
import { FileItem } from "@/lib/types";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const type = formData.get("type") as string;
    const slug = formData.get("slug") as string;
    const isHeadlineUpload = formData.get("isHeadline") === "true";
    const fileMetaRaw = formData.get("fileMeta") as string;
    const fileMeta: { name: string; alt: string; originalName: string }[] =
      JSON.parse(fileMetaRaw);

    const uploadsDir = getUploadsDir(slug);
    ensureDir(uploadsDir);

    const content = readContent(type, slug);
    if (!content) {
      return NextResponse.json({ success: false, error: "İçerik bulunamadı" }, { status: 404 });
    }

    const savedFiles: FileItem[] = [];
    let headlinePath = content.headline_image || "";

    const files = formData.getAll("files") as File[];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const meta = fileMeta[i];
      if (!file || !meta) continue;

      const buffer = Buffer.from(await file.arrayBuffer());

      // Uzantıyı ORIJINAL dosyadan al, kullanıcının girdiği isme ekle
      const originalExt = path.extname(meta.originalName); // örn: ".jpg"
      const baseName = meta.name
        .replace(/\.[^.]+$/, "") // kullanıcı yanlışlıkla uzantı yazmışsa sil
        .trim();
      const finalName = baseName + originalExt; // güvenli birleştirme

      const destPath = path.join(uploadsDir, finalName);
      fs.writeFileSync(destPath, buffer);

      const publicPath = `/uploads/${slug}/${finalName}`;

      if (isHeadlineUpload && i === 0) {
        headlinePath = publicPath;
      } else {
        savedFiles.push({
          id: (content.files?.length || 0) + savedFiles.length,
          name: finalName,
          alt: meta.alt,
          path: publicPath,
          originalName: meta.originalName,
        });
      }
    }

    const updated = {
      ...content,
      headline_image: headlinePath,
      files: [...(content.files || []), ...savedFiles],
    };
    upsertContent(type, updated);

    return NextResponse.json({ success: true, files: savedFiles, headlinePath });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
