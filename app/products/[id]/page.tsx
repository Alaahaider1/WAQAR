import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProductBySlug, fetchPublishedSlugs } from "@/lib/catalog/server";
import ProductDetailClient from "./ProductDetailClient";

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  try {
    const slugs = await fetchPublishedSlugs();
    return slugs.map((id) => ({ id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProductBySlug(id);
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.name} — ${product.subtitle}`,
    description: product.longDescription.slice(0, 155),
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await fetchProductBySlug(id);
  if (!product) notFound();

  return <ProductDetailClient product={product} />;
}
