import MetaForm from "@/components/MetaForm";

interface PageProps {
  searchParams: Promise<{ type?: string; edit?: string; slug?: string }>;
}

export default async function ComposePage({ searchParams }: PageProps) {
  const { type, edit, slug } = await searchParams;
  const isEdit = edit === "true" && !!slug;
  return <MetaForm slug={isEdit ? slug : undefined} type={type} isEdit={isEdit} />;
}
