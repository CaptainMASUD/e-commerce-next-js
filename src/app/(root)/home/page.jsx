import HomePageClient from "@/Components/Home/HomePageClient";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000"
  );
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function getCategories() {
  try {
    const baseUrl = getBaseUrl();

    const res = await fetch(
      `${baseUrl}/api/categories?subView=home&includeSub=true&limit=200`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return { items: [], error: `Failed to load categories (${res.status})` };
    }

    const data = await safeJson(res);
    const cats = Array.isArray(data?.items) ? data.items : [];

    const flat = [];

    for (const c of cats) {
      const catSlug = c?.slug || "";
      const subs = Array.isArray(c?.subcategories) ? c.subcategories : [];

      for (const s of subs) {
        const label = s?.name || "";
        const img = s?.image?.url || "";
        if (!label || !img) continue;

        flat.push({
          label,
          img,
          alt: s?.image?.alt || label,
          categorySlug: catSlug,
          subSlug: s?.slug || "",
        });
      }
    }

    return { items: flat, error: "" };
  } catch (error) {
    return {
      items: [],
      error: error?.message || "Something went wrong while loading categories.",
    };
  }
}

async function getProducts(params = {}) {
  try {
    const baseUrl = getBaseUrl();
    const sp = new URLSearchParams();

    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      sp.set(k, String(v));
    });

    const res = await fetch(`${baseUrl}/api/products?${sp.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await safeJson(res);
    return Array.isArray(data?.products) ? data.products : [];
  } catch {
    return [];
  }
}

export default async function Page({ searchParams }) {
  const query =
    typeof searchParams?.q === "string" ? searchParams.q.trim() : "";

  const [categoriesResult, trending, newArrivals, products] = await Promise.all([
    getCategories(),
    getProducts({ only: "trending", limit: 12, page: 1, prioritize: 1 }),
    getProducts({ only: "new", limit: 10, page: 1, prioritize: 1 }),
    getProducts({ q: query, limit: 24, page: 1, prioritize: 1 }),
  ]);

  return (
    <HomePageClient
      query={query}
      initialHomeCategories={categoriesResult.items}
      initialHomeCatError={categoriesResult.error}
      initialTrending={trending}
      initialNewArrivals={newArrivals}
      initialProducts={products}
    />
  );
}