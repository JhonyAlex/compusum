import { redirect } from "next/navigation";

export default async function MarcaSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/catalogo?marca=${encodeURIComponent(slug)}`);
}
