import React from "react";
import { headers } from "next/headers";
import NavbarClient from "./NavbarClient";

const CATEGORIES_ENDPOINT = "/api/categories?includeSub=true&limit=100";

async function getBaseUrlFromHeaders() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

async function fetchCategoriesSSR() {
  const baseUrl = await getBaseUrlFromHeaders();
  const url = new URL(CATEGORIES_ENDPOINT, baseUrl);

  const res = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.details || json?.error || `Failed to load categories (${res.status})`);
  }

  const raw = Array.isArray(json?.items) ? json.items : [];

  const categories = raw
    .filter((c) => c && c.isActive !== false)
    .map((c) => ({
      id: c._id || c.id || c.slug,
      label: c.name,
      slug: c.slug,
      sortOrder: c.sortOrder ?? 0,
      subcategories: Array.isArray(c.subcategories) ? c.subcategories : [],
    }))
    .sort((a, b) => (a.sortOrder - b.sortOrder) || String(a.label || "").localeCompare(String(b.label || "")));

  return categories;
}

export default async function NavbarServer(props) {
  let categories = [];
  let catError = null;

  try {
    categories = await fetchCategoriesSSR();
  } catch (e) {
    categories = [];
    catError = e?.message || "Failed to load categories";
  }

  return <NavbarClient {...props} initialCategories={categories} initialCatError={catError} />;
}