import ShopPageClient from "./ShopPageClient";
import { headers } from "next/headers";

const LIMIT = 24;

async function getBaseUrlFromHeaders() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

async function getJSON(url) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || data?.error || "Request failed");
  }

  return data;
}

function buildQS(params) {
  const sp = new URLSearchParams();

  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

function titleCaseFromSlug(s) {
  return String(s || "")
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function normalizeCategories(raw) {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.categories)
    ? raw.categories
    : Array.isArray(raw?.data)
    ? raw.data
    : [];

  return list.map((c) => ({
    _id: c?._id || c?.id || c?.value || "",
    name: c?.name || c?.label || titleCaseFromSlug(c?.slug || "") || "Category",
    slug: c?.slug || "",
    subcategories: Array.isArray(c?.subcategories)
      ? c.subcategories.map((s) => ({
          _id: s?._id || s?.id || s?.value || "",
          name: s?.name || s?.label || titleCaseFromSlug(s?.slug || "") || "Subcategory",
          slug: s?.slug || "",
        }))
      : [],
  }));
}

function normalizeBrands(raw) {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.brands)
    ? raw.brands
    : Array.isArray(raw?.data)
    ? raw.data
    : [];

  return list.map((b) => ({
    _id: b?._id || b?.id || b?.value || "",
    name: b?.name || b?.label || titleCaseFromSlug(b?.slug || "") || "Brand",
    slug: b?.slug || "",
  }));
}

async function fetchAllCategories(baseUrl) {
  let all = [];
  let cursor = "";
  let hasNextPage = true;

  while (hasNextPage) {
    const qs = buildQS({
      includeSub: "true",
      limit: 100,
      cursor,
    });

    const data = await getJSON(`${baseUrl}/api/categories${qs}`);
    const items = normalizeCategories(data);

    all = [...all, ...items];
    hasNextPage = Boolean(data?.pageInfo?.hasNextPage);
    cursor = data?.pageInfo?.nextCursor || "";
  }

  const map = new Map();
  for (const item of all) {
    if (!item?.slug) continue;
    if (!map.has(item.slug)) map.set(item.slug, item);
  }

  return Array.from(map.values());
}

async function fetchAllBrands(baseUrl) {
  let all = [];
  let afterId = "";
  let afterSortOrder = "";
  let hasNextPage = true;

  while (hasNextPage) {
    const qs = buildQS({
      limit: 100,
      afterId,
      afterSortOrder,
    });

    const data = await getJSON(`${baseUrl}/api/brands${qs}`);
    const items = normalizeBrands(data);

    all = [...all, ...items];
    hasNextPage = Boolean(data?.pageInfo?.hasNextPage);
    afterId = data?.pageInfo?.nextCursor?.afterId || "";
    afterSortOrder = data?.pageInfo?.nextCursor?.afterSortOrder ?? "";
  }

  const map = new Map();
  for (const item of all) {
    if (!item?.slug) continue;
    if (!map.has(item.slug)) map.set(item.slug, item);
  }

  return Array.from(map.values());
}

async function getInitialShopData(searchParams) {
  const q = String(searchParams?.q || "").trim();
  const brand = String(searchParams?.brand || "").trim();
  const categorySlug = String(searchParams?.categorySlug || "").trim();
  const subSlug = String(searchParams?.subSlug || "").trim();

  const baseUrl = await getBaseUrlFromHeaders();

  const qs = buildQS({
    q,
    brand,
    categorySlug,
    subSlug,
    sort: "latest",
    limit: LIMIT,
    page: 1,
  });

  const [productsRes, categoriesRes, brandsRes] = await Promise.allSettled([
    getJSON(`${baseUrl}/api/products${qs}`),
    fetchAllCategories(baseUrl),
    fetchAllBrands(baseUrl),
  ]);

  const productsData =
    productsRes.status === "fulfilled" ? productsRes.value : null;

  const categories =
    categoriesRes.status === "fulfilled" ? categoriesRes.value : [];

  const brands =
    brandsRes.status === "fulfilled" ? brandsRes.value : [];

  return {
    initialItems: Array.isArray(productsData?.products)
      ? productsData.products
      : [],
    initialBanner: productsData?.banner?.url || "",
    initialHasMore:
      Array.isArray(productsData?.products) &&
      productsData.products.length === LIMIT,
    initialServerTotal: Array.isArray(productsData?.products)
      ? productsData.products.length
      : 0,
    initialCategories: categories,
    initialBrands: brands,
    initialError:
      productsRes.status === "rejected"
        ? productsRes.reason?.message || "Failed to load products"
        : "",
  };
}

export default async function Page({ searchParams }) {
  const sp = await searchParams;
  const initialData = await getInitialShopData(sp);

  return (
    <ShopPageClient
      initialQ={sp?.q || ""}
      initialCategorySlug={sp?.categorySlug || ""}
      initialSubSlug={sp?.subSlug || ""}
      initialBrand={sp?.brand || ""}
      initialItems={initialData.initialItems}
      initialBanner={initialData.initialBanner}
      initialHasMore={initialData.initialHasMore}
      initialServerTotal={initialData.initialServerTotal}
      initialCategories={initialData.initialCategories}
      initialBrands={initialData.initialBrands}
      initialError={initialData.initialError}
    />
  );
}