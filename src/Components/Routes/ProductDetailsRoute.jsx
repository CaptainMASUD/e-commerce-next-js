"use client";

/**
 * ✅ Next.js replacement for old React Router ProductDetailsRoute
 * This file exists ONLY to prevent broken imports.
 * If something still imports this component, it will redirect
 * to the correct Next.js App Router product page.
 *
 * IMPORTANT:
 * - Make sure your actual details page is:
 *   app/product/[slug]/page.jsx   (route: /product/:slug)
 *   OR app/products/[slug]/page.jsx (route: /products/:slug)
 */

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProductDetailsRoute() {
  const router = useRouter();
  const params = useParams();

  // if your folder is app/product/[slug], keep "/product/"
  const slug = params?.slug || params?.id || params?.productId;

  useEffect(() => {
    if (!slug) return;
    router.replace(`/product/${slug}`);
  }, [slug, router]);

  return <div className="p-6 font-bold">Redirecting…</div>;
}