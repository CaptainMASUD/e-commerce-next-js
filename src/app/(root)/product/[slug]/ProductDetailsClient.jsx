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

export default function ProductDetailsClient({
  slug,
  initialProduct = null,
  initialRelatedProducts = [],
  initialError = "",
}) {
  const nav = useNav();
  const safeSlug = useMemo(() => String(slug || "").trim(), [slug]);

  const [product, setProduct] = useState(initialProduct);
  const [relatedProducts, setRelatedProducts] = useState(
    Array.isArray(initialRelatedProducts) ? initialRelatedProducts : []
  );
  const [loading, setLoading] = useState(!initialProduct && !initialError);
  const [err, setErr] = useState(initialError || "");

  useEffect(() => {
    setProduct(initialProduct || null);
    setRelatedProducts(Array.isArray(initialRelatedProducts) ? initialRelatedProducts : []);
    setErr(initialError || "");
    setLoading(!initialProduct && !initialError);
  }, [initialProduct, initialRelatedProducts, initialError]);

  useEffect(() => {
    let alive = true;

    if (!safeSlug) {
      setErr("Invalid product slug");
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    // If SSR already provided product or error, skip client fetch on first render
    if (initialProduct || initialError) {
      return () => {
        alive = false;
      };
    }

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const data = await fetchJSON(`/api/products/${encodeURIComponent(safeSlug)}`);
        const p = data?.product || null;

        if (!alive) return;

        setProduct(p);

        if (!p) {
          setErr("Product not found");
          setRelatedProducts([]);
          return;
        }

        try {
          const relatedData = await fetchJSON(
            `/api/products/${encodeURIComponent(safeSlug)}/related?limit=8`
          );

          if (!alive) return;

          setRelatedProducts(
            Array.isArray(relatedData?.products) ? relatedData.products : []
          );
        } catch {
          if (!alive) return;
          setRelatedProducts([]);
        }
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load product");
        setProduct(null);
        setRelatedProducts([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [safeSlug, initialProduct, initialError]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="text-lg font-semibold text-slate-700">Loading product...</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-lg font-semibold text-rose-600">
          {err}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-lg font-semibold text-slate-700">
          Product not found
        </div>
      </div>
    );
  }

  return (
    <ProductDetailsUI
      product={product}
      relatedProducts={relatedProducts}
      onBack={() => nav.back()}
      onSelectRelated={(item) => {
        const nextSlug = item?.slug || item?._id || item?.id;
        if (nextSlug) nav.push(`/product/${nextSlug}`);
      }}
    />
  );
}