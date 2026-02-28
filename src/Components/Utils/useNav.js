"use client";

import { useRouter } from "next/navigation";

export default function useNav() {
  const router = useRouter();

  const start = () => {
    if (typeof window !== "undefined" && window.__toploaderStart) {
      window.__toploaderStart();
    }
  };

  const isSameUrl = (url) => {
    if (typeof window === "undefined") return false;

    try {
      const nextUrl = new URL(url, window.location.href);
      const curUrl = new URL(window.location.href);
      return nextUrl.pathname === curUrl.pathname && nextUrl.search === curUrl.search;
    } catch {
      return false;
    }
  };

  return {
    push: (url) => {
      if (isSameUrl(url)) return;
      start();
      router.push(url);
    },
    replace: (url) => {
      if (isSameUrl(url)) return;
      start();
      router.replace(url);
    },
    back: () => {
      start();
      router.back();
    },
    forward: () => {
      start();
      router.forward();
    },
    refresh: () => {
      start();
      router.refresh();
    },
  };
}