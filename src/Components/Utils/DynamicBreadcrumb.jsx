"use client";

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
  hiddenRoutes = ["/"],
}) {
  const pathname = usePathname() || "/";

  if (hiddenRoutes.includes(pathname)) return null;

  const crumbs = useMemo(() => {
    const clean = pathname.replace(/\/+$/, "") || "/";
    const segments = clean.split("/").filter(Boolean);

    if (segments.length === 0) return [];

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

  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`w-full bg-transparent ${className}`}
      style={{ background: "transparent" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <ol className="flex items-center gap-1 sm:gap-2 overflow-hidden whitespace-nowrap text-xs sm:text-sm font-medium text-gray-700">
          {crumbs.map((c, idx) => (
            <li
              key={c.key}
              className={`flex min-w-0 items-center ${
                c.active ? "flex-1" : "shrink-0"
              }`}
            >
              {idx !== 0 ? (
                <svg
                  aria-hidden="true"
                  className="mx-1 h-3.5 w-3.5 shrink-0 text-gray-400 sm:mx-2 sm:h-4 sm:w-4"
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
                  className="inline-flex min-w-0 items-center gap-1.5 sm:gap-2 text-gray-900"
                  aria-current="page"
                >
                  {c.isHome ? (
                    <FiHome className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  ) : null}
                  <span className="truncate max-w-[140px] sm:max-w-[220px] md:max-w-[320px]">
                    {c.label}
                  </span>
                </span>
              ) : (
                <Link
                  href={c.href}
                  className="inline-flex shrink-0 items-center gap-1.5 sm:gap-2 text-gray-700 transition-colors hover:text-gray-900"
                  style={{ background: "transparent" }}
                >
                  {c.isHome ? (
                    <FiHome className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  ) : null}
                  <span className="truncate max-w-[70px] sm:max-w-[120px] md:max-w-none">
                    {c.label}
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}