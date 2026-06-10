import { NextRequest, NextResponse } from "next/server";
import { readAllContents } from "@/lib/fs-helpers";

export async function POST(req: NextRequest) {
  const { slug, title, type, originalSlug } = await req.json();

  const all = readAllContents();
  // Edit modunda kendi mevcut kaydını hariç tut
  const others = originalSlug ? all.filter((c) => c.slug !== originalSlug) : all;

  // Slug çakışması — type ayrımı olmaksızın tüm içeriklerde kontrol
  if (others.some((c) => c.slug === slug)) {
    return NextResponse.json({ conflict: "slug", message: "Bu slug zaten mevcut." });
  }

  // Başlık çakışması — sadece aynı type içinde
  if (others.some((c) => c.type === type && c.title?.toLowerCase() === title?.toLowerCase())) {
    return NextResponse.json({ conflict: "title", message: "Bu başlıkla zaten bir içerik var." });
  }

  return NextResponse.json({ conflict: null });
}
