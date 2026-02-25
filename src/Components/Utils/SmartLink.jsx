"use client";

import Link from "next/link";

export default function SmartLink({ href, onClick, children, ...props }) {
  return (
    <Link
      href={href}
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (typeof window !== "undefined" && window.__routeLoaderStart) {
          window.__routeLoaderStart();
        }
      }}
    >
      {children}
    </Link>
  );
}
