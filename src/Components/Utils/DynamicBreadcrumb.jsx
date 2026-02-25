"use client";

// ✅ DynamicBreadcrumb.jsx (Next.js App Router)
// Fixes requested:
// 1) Home shows icon + "Home" label (not icon only)
// 2) Removes any background color (transparent, no hover bg tint)
// 3) Hides breadcrumb on "/" AND any routes passed via hiddenRoutes (ex: "/home")

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome } from "react-icons/fi";

const pretty = (s) =>
  decodeURIComponent(s)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function DynamicBreadcrumb({
  labels = {
    brands: "Brands",
    categories: "Categories",
    products: "Products",
    product: "Product",
  },
  rootLabel = "Home",
  resolveCrumb,
  className = "",
  hiddenRoutes = ["/"], // ✅ default hide on "/"
}) {
  const pathname = usePathname() || "/";

  // ✅ Hide if current route is in hiddenRoutes (ex: "/" or "/home")
  if (hiddenRoutes.includes(pathname)) return null;

  const crumbs = useMemo(() => {
    const clean = pathname.replace(/\/+$/, "") || "/";
    const segments = clean.split("/").filter(Boolean);

    // ✅ If "/" after cleaning, hide
    if (segments.length === 0) return [];

    // ✅ ALWAYS start with Home
    const items = [
      {
        key: "root",
        label: rootLabel,
        href: "/",
        active: false,
        isHome: true,
      },
    ];

    let acc = "";
    segments.forEach((seg, index) => {
      acc += `/${seg}`;
      const isLast = index === segments.length - 1;

      let label = labels[seg] ?? pretty(seg);

      // ✅ safe resolver (never crash)
      if (typeof resolveCrumb === "function") {
        try {
          const custom = resolveCrumb({
            segment: seg,
            pathname: clean,
            index,
            segments,
            isLast,
          });
          if (custom) label = custom;
        } catch {
          // keep default label
        }
      }

      items.push({
        key: acc,
        label,
        href: acc,
        active: isLast,
        isHome: false,
      });
    });

    return items;
  }, [pathname, labels, rootLabel, resolveCrumb]);

  // ✅ hide if no crumbs (home)
  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`w-full py-2 bg-transparent ${className}`}
      style={{ background: "transparent" }}
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-gray-700">
        {crumbs.map((c, idx) => (
          <li key={c.key} className="flex items-center">
            {idx !== 0 ? (
              <svg
                aria-hidden="true"
                className="mx-2 h-4 w-4 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : null}

            {c.active ? (
              <span
                className="inline-flex items-center gap-2 text-gray-900"
                aria-current="page"
              >
                {c.isHome ? <FiHome className="h-4 w-4" /> : null}
                {c.label}
              </span>
            ) : (
              <Link
                href={c.href}
                className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900"
                style={{ background: "transparent" }}
              >
                {c.isHome ? <FiHome className="h-4 w-4" /> : null}
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
