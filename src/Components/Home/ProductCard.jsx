"use client";

import React from "react";
import useNav from "@/Components/Utils/useNav";

export default function ProductCard({ product }) {
  const nav = useNav();
  const slug = String(product?.slug || "").trim();

  return (
    <button
      type="button"
      disabled={!slug}
      onClick={() => {
        if (!slug) return;
        nav.push(`/product/${encodeURIComponent(slug)}`);
      }}
      className="w-full text-left disabled:opacity-60"
    >
      {/* your card UI */}
      <div>{product?.name}</div>
    </button>
  );
}