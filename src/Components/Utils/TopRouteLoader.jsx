"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopRouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const tickRef = useRef(null);
  const startTimeRef = useRef(0);
  const finishingRef = useRef(false);

  const clearTick = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
  };

  const start = () => {
    // avoid re-starting repeatedly
    if (visible && progress > 10 && !finishingRef.current) return;

    finishingRef.current = false;
    clearTick();
    startTimeRef.current = Date.now();

    setVisible(true);
    setProgress((p) => (p > 0 ? Math.min(25, p) : 8));

    tickRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return 92;
        const inc = p < 25 ? 10 : p < 55 ? 6 : 2;
        return Math.min(92, p + inc);
      });
    }, 180);
  };

  const finish = () => {
    if (!visible || finishingRef.current) return;
    finishingRef.current = true;

    clearTick();
    setProgress(100);

    const elapsed = Date.now() - startTimeRef.current;
    const minVisible = 350;
    const wait = Math.max(0, minVisible - elapsed);

    setTimeout(() => {
      setVisible(false);
      setProgress(0);
      finishingRef.current = false;
    }, 220 + wait);
  };

  // ✅ expose for useNav()
  useEffect(() => {
    window.__toploaderStart = start;
    window.__toploaderFinish = finish;

    return () => {
      delete window.__toploaderStart;
      delete window.__toploaderFinish;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, progress]);

  // ✅ finish when route commits
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => finish(), 80);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  // ✅ start on internal <a> clicks (covers Next <Link />)
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

      // ✅ no-op navigation (same path+search) => don’t start
      if (
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search
      ) {
        return;
      }

      start();
    };

    window.addEventListener("click", onClickCapture, true);
    return () => window.removeEventListener("click", onClickCapture, true);
  }, []);

  // ✅ start on browser back/forward
  useEffect(() => {
    const onPopState = () => start();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed left-0 top-0 z-[9999] h-[3px] w-full">
      <div
        className="h-full rounded-r-full"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #001f3f, #ff7e69, #eab308)",
          boxShadow: "0 0 10px rgba(255,126,105,.30)",
          transition: "width 160ms ease",
        }}
      />
    </div>
  );
}