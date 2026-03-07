"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopRouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const tickRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const historyFinishRef = useRef(null);

  const startTimeRef = useRef(0);
  const visibleRef = useRef(false);
  const finishingRef = useRef(false);
  const navTypeRef = useRef(null); // "link" | "history"

  const clearTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const clearHistoryFinish = () => {
    if (historyFinishRef.current) {
      clearTimeout(historyFinishRef.current);
      historyFinishRef.current = null;
    }
  };

  const finish = () => {
    if (!visibleRef.current || finishingRef.current) return;

    finishingRef.current = true;
    clearTick();
    clearHistoryFinish();
    setProgress(100);

    const elapsed = Date.now() - startTimeRef.current;
    const minVisible = navTypeRef.current === "history" ? 180 : 320;
    const wait = Math.max(0, minVisible - elapsed);

    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      visibleRef.current = false;
      finishingRef.current = false;
      navTypeRef.current = null;
      setVisible(false);
      setProgress(0);
      hideTimeoutRef.current = null;
    }, 160 + wait);
  };

  const start = (type = "link") => {
    clearTick();
    clearHideTimeout();
    clearHistoryFinish();

    navTypeRef.current = type;
    startTimeRef.current = Date.now();
    visibleRef.current = true;
    finishingRef.current = false;

    setVisible(true);
    setProgress(8);

    tickRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return 92;
        const inc = p < 25 ? 10 : p < 55 ? 6 : 2;
        return Math.min(92, p + inc);
      });
    }, 180);

    // Back/forward can be restored almost instantly from cache,
    // so give it a short self-finish path to avoid looking stuck.
    if (type === "history") {
      historyFinishRef.current = setTimeout(() => {
        finish();
      }, 220);
    }
  };

  useEffect(() => {
    window.__toploaderStart = start;
    window.__toploaderFinish = finish;

    return () => {
      delete window.__toploaderStart;
      delete window.__toploaderFinish;
    };
  }, []);

  // Standard finish when route/search actually commits
  useEffect(() => {
    if (!visibleRef.current) return;

    const t = setTimeout(() => {
      finish();
    }, 60);

    return () => clearTimeout(t);
  }, [pathname, searchParams?.toString()]);

  // Start on internal anchor clicks
  useEffect(() => {
    const isModified = (e) =>
      e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;

    const onClickCapture = (e) => {
      if (isModified(e)) return;

      const a = e.target.closest?.("a");
      if (!a) return;

      const href = a.getAttribute("href");
      if (!href) return;

      const target = a.getAttribute("target");
      const download = a.hasAttribute("download");

      if (download) return;
      if (target && target !== "_self") return;
      if (href.startsWith("#")) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let nextUrl;
      try {
        nextUrl = new URL(href, window.location.href);
        if (nextUrl.origin !== window.location.origin) return;
      } catch {
        return;
      }

      const currentUrl = new URL(window.location.href);

      if (
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search
      ) {
        return;
      }

      start("link");
    };

    window.addEventListener("click", onClickCapture, true);
    return () => window.removeEventListener("click", onClickCapture, true);
  }, []);

  // Start on browser back/forward
  useEffect(() => {
    const onPopState = () => {
      start("history");
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    return () => {
      clearTick();
      clearHideTimeout();
      clearHistoryFinish();
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed left-0 top-0 z-[9999] h-[3px] w-full pointer-events-none">
      <div
        className="h-full rounded-r-full"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #001f3f, #ff7e69, #eab308)",
          boxShadow: "0 0 10px rgba(255,126,105,.30)",
          transition: "width 160ms ease, opacity 180ms ease",
        }}
      />
    </div>
  );
}