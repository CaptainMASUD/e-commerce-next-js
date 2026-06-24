import { headers } from "next/headers";
import ProductDetailsClient from "./ProductDetailsClient";

export const dynamic = "force-dynamic";

async function getBaseUrlFromHeaders() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

async function fetchJSON(path) {
  const baseUrl = await getBaseUrlFromHeaders();
  const url = new URL(path, baseUrl);

  const res = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data;
}

async function fetchProductSSR(slug) {
  const data = await fetchJSON(`/api/products/${encodeURIComponent(slug)}`);
  return data?.product || null;
}

async function fetchRelatedProductsSSR(slug) {
  try {
    const data = await fetchJSON(`/api/products/${encodeURIComponent(slug)}/related?limit=8`);
    return Array.isArray(data?.products) ? data.products : [];
  } catch {
    return [];
  }
}

export default async function Page({ params }) {
  const resolvedParams = typeof params?.then === "function" ? await params : params;
  const { slug } = resolvedParams || {};

  const safeSlug = String(slug || "").trim();

  if (!safeSlug) {
    return <div className="p-6 font-bold">Invalid product slug</div>;
  }

  let initialProduct = null;
  let initialRelatedProducts = [];
  let initialError = "";

  try {
    initialProduct = await fetchProductSSR(safeSlug);

    if (!initialProduct) {
      initialError = "Product not found";
    } else {
      initialRelatedProducts = await fetchRelatedProductsSSR(safeSlug);
    }
  } catch (e) {
    initialError = e?.message || "Failed to load product";
  }

  return (
    <ProductDetailsClient
      slug={safeSlug}
      initialProduct={initialProduct}
      initialRelatedProducts={initialRelatedProducts}
      initialError={initialError}
    />
  );
}