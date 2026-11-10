import { notFound } from "next/navigation";
import { getProductById } from "@/services/catalog";
import ProductPage from "@/components/ProductPage";

export default async function ProductRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();
  return <ProductPage product={product} />;
}
