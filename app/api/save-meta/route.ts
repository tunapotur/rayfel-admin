import { NextRequest, NextResponse } from "next/server";
import { upsertContent, getNextId } from "@/lib/fs-helpers";
import { ContentMeta } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { type, newsType, title, description, language, date, slug } = await req.json();

    const id = getNextId(type);

    const meta: ContentMeta = {
      id,
      type,
      ...(type === "news" && newsType ? { newsType } : {}),
      title,
      description,
      language,
      date,
      slug,
      headline_image: "",
      mainText: "",
      files: [],
    };

    upsertContent(type, meta);

    return NextResponse.json({ success: true, id, slug });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
