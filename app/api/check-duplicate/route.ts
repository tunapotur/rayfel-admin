import { NextRequest, NextResponse } from "next/server";
import { getAllSlugs, readAllContents } from "@/lib/fs-helpers";

export async function POST(req: NextRequest) {
  const { slug, title, type } = await req.json();

  const all = readAllContents(type);

  if (all.some((c) => c.slug === slug)) {
    return NextResponse.json({ conflict: "slug", message: "Bu slug zaten mevcut." });
  }

  if (all.some((c) => c.title?.toLowerCase() === title?.toLowerCase())) {
    return NextResponse.json({ conflict: "title", message: "Bu başlıkla zaten bir içerik var." });
  }

  return NextResponse.json({ conflict: null });
}
