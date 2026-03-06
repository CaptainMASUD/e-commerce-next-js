"use client";

import React, { useEffect, useMemo, useState } from "react";
import useNav from "@/Components/Utils/useNav";
import ProductDetailsUI from "./ProductDetailsUI";

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });

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

export default function ProductDetailsClient({ slug }) {
  const nav = useNav();
  const safeSlug = useMemo(() => String(slug || "").trim(), [slug]);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    if (!safeSlug) {
      setErr("Invalid product slug");
      setLoading(false);
      return () => {};
    }

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const data = await fetchJSON(`/api/products/${encodeURIComponent(safeSlug)}`);
        const p = data?.product || null;

        if (!alive) return;

        setProduct(p);
        if (!p) setErr("Product not found");
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load product");
        setProduct(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [safeSlug]);

  if (loading) return <div className="p-6 font-bold">Loading...</div>;
  if (err) return <div className="p-6 font-bold">{err}</div>;
  if (!product) return <div className="p-6 font-bold">Product not found</div>;

  return <ProductDetailsUI product={product} onBack={() => nav.back()} />;
}