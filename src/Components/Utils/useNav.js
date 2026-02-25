"use client";

import { useRouter } from "next/navigation";

export default function useNav() {
  const router = useRouter();

  const start = () => {
    if (typeof window !== "undefined" && window.__toploaderStart) {
      window.__toploaderStart();
    }
  };

  return {
    push: (url) => {
      start();
      router.push(url);
    },
    replace: (url) => {
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
