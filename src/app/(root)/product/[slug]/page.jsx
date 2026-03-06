import ProductDetailsClient from "./ProductDetailsClient";

export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const resolvedParams = typeof params?.then === "function" ? await params : params;
  const { slug } = resolvedParams || {};

  const safeSlug = String(slug || "").trim();
  if (!safeSlug) return <div className="p-6 font-bold">Invalid product slug</div>;

  return <ProductDetailsClient slug={safeSlug} />;
}