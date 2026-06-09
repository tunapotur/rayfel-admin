import FileUploader from "@/components/FileUploader";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function FilesPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { type = "news" } = await searchParams;
  return <FileUploader slug={slug} type={type} />;
}
