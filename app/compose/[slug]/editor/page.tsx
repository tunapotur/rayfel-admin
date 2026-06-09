import EditorPage from "@/components/EditorPage";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function EditorRoute({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { type = "news" } = await searchParams;
  return <EditorPage slug={slug} type={type} />;
}
