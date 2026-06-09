import { NextRequest, NextResponse } from "next/server";
import { getProjectPath } from "@/lib/fs-helpers";
import fs from "fs";
import path from "path";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

export async function GET(req: NextRequest) {
  const filePath = req.nextUrl.searchParams.get("path");
  if (!filePath) {
    return new NextResponse("path parametresi gerekli", { status: 400 });
  }

  // Güvenlik: path traversal önlemi
  const normalized = path.normalize(filePath).replace(/^(\.\.[/\\])+/, "");
  const absPath = path.join(getProjectPath(), "public", normalized);

  if (!fs.existsSync(absPath)) {
    return new NextResponse("Dosya bulunamadı", { status: 404 });
  }

  const ext = path.extname(absPath).toLowerCase();
  const mime = MIME[ext] || "application/octet-stream";
  const buffer = fs.readFileSync(absPath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
