import { NextRequest, NextResponse } from "next/server";
import { upsertContent, readContent, ensureDir, getUploadsDir, fileExistsInUploads } from "@/lib/fs-helpers";
import { generateFileId } from "@/lib/id";
import { FileItem } from "@/lib/types";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const slug = formData.get("slug") as string;
    const isHeadlineUpload = formData.get("isHeadline") === "true";
    const fileMetaRaw = formData.get("fileMeta") as string;
    const fileMeta: { name: string; alt: string; originalName: string }[] = JSON.parse(fileMetaRaw);

    const content = readContent(slug);
    if (!content) {
      return NextResponse.json({ success: false, error: "İçerik bulunamadı" }, { status: 404 });
    }

    const uploadsDir = getUploadsDir(content.id);
    ensureDir(uploadsDir);

    const savedFiles: FileItem[] = [];
    let headlinePath = content.headline_image || "";

    const files = formData.getAll("files") as File[];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const meta = fileMeta[i];
      if (!file || !meta) continue;

      const buffer = Buffer.from(await file.arrayBuffer());

      const originalExt = path.extname(meta.originalName);
      const baseName = meta.name.replace(/\.[^.]+$/, "").trim();
      const finalName = baseName + originalExt;

      // Aynı klasörde aynı isim+uzantı varsa hata dön
      if (fileExistsInUploads(content.id, finalName)) {
        return NextResponse.json({
          success: false,
          error: `"${finalName}" adında bir dosya zaten mevcut. Lütfen farklı bir isim girin.`,
        }, { status: 409 });
      }

      fs.writeFileSync(path.join(uploadsDir, finalName), buffer);
      const publicPath = `/uploads/${content.id}/${finalName}`;

      // Headline olan dosya: headline_image alanına yaz
      if (isHeadlineUpload && i === 0) {
        headlinePath = publicPath;
      }

      // Tüm dosyalar files[] array'ine eklenir (headline dahil)
      savedFiles.push({
        id: generateFileId(),
        name: finalName,
        alt: meta.alt,
        path: publicPath,
      });
    }

    const updated = {
      ...content,
      headline_image: headlinePath,
      files: [...(content.files || []), ...savedFiles],
    };
    upsertContent(updated);

    return NextResponse.json({ success: true, files: savedFiles, headlinePath });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}