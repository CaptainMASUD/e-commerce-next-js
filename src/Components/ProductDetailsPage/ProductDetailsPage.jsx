"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiShare2,
  FiShield,
  FiTruck,
  FiRefreshCcw,
  FiStar,
  FiCheckCircle,
  FiMinus,
  FiPlus,
  FiTag,
  FiInfo,
} from "react-icons/fi";

/**
 * ✅ ProductDetailsPage.jsx (Next.js App Router)
 * ✅ Added "use client"
 * ✅ No react-router usage
 * ✅ Cursor-pointer where needed (kept)
 * ✅ Same design + behavior
 */

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  cta: "#ff6b6b",
  gold: "#eab308",
  bg: "#fafafa",
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatBDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n || 0);

function Stars({ value = 0 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;

  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <FiStar
            key={i}
            className="h-4 w-4"
            style={{
              color: filled ? PALETTE.gold : "rgba(0,0,0,.12)",
              fill: filled ? PALETTE.gold : "transparent",
            }}
          />
        );
      })}
    </div>
  );
}

function Chip({ children, tone = "soft" }) {
  const map = {
    navy: { bg: PALETTE.navy, fg: "#fff" },
    coral: { bg: PALETTE.coral, fg: PALETTE.navy },
    gold: { bg: "rgba(234,179,8,.16)", fg: PALETTE.navy },
    soft: { bg: "rgba(0,31,63,.06)", fg: PALETTE.navy },
  };
  const t = map[tone] || map.soft;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black ring-1 ring-black/5"
      style={{ background: t.bg, color: t.fg }}
    >
      {children}
    </span>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="mb-3">
      <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
        {title}
      </div>
      <div className="mt-2 h-2 w-44 overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full w-[68%] rounded-full"
          style={{
            background: `linear-gradient(90deg, ${PALETTE.coral}, rgba(0,31,63,.14))`,
          }}
        />
      </div>
    </div>
  );
}

function FeatureRow() {
  const items = [
    { Icon: FiShield, label: "Secure payment" },
    { Icon: FiTruck, label: "Fast delivery" },
    { Icon: FiRefreshCcw, label: "Easy returns" },
  ];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {items.map(({ Icon, label }) => (
        <div
          key={label}
          className="inline-flex cursor-default items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-2 text-xs font-black text-slate-900 shadow-sm"
          style={{ boxShadow: "0 10px 24px rgba(0,31,63,.05)" }}
        >
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-full"
            style={{ background: "rgba(0,31,63,0.05)" }}
          >
            <Icon className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </span>
          {label}
        </div>
      ))}
    </div>
  );
}

function Thumb({ src, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-2xl ring-1 transition",
        active ? "ring-black/20" : "ring-black/10 hover:ring-black/20"
      )}
      style={{
        boxShadow: active ? "0 14px 34px rgba(0,31,63,.10)" : "0 10px 24px rgba(0,31,63,.06)",
      }}
      aria-label="Select image"
      type="button"
    >
      <img src={src} alt="" className="h-16 w-16 object-cover" loading="lazy" decoding="async" />
      {active ? (
        <span
          className="absolute bottom-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: PALETTE.navy }}
        >
          <FiCheckCircle className="h-4 w-4 text-white" />
        </span>
      ) : null}
    </button>
  );
}

function Gallery({ images, title }) {
  const [idx, setIdx] = useState(0);
  const wrapRef = useRef(null);

  const prev = useCallback(() => setIdx((p) => (p - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx((p) => (p + 1) % images.length), [images.length]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const child = el.querySelector(`[data-i='${idx}']`);
    if (!child) return;
    child.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  }, [idx]);

  return (
    <div className="rounded-[1.75rem] border border-black/5 bg-white p-3 shadow-sm">
      <div className="relative overflow-hidden rounded-[1.35rem] ring-1 ring-black/5">
        <img
          src={images[idx]}
          alt={title}
          className="h-[260px] w-full object-cover sm:h-[320px] lg:h-[360px]"
          loading="eager"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

        <button
          onClick={prev}
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-white/95 p-2 shadow-sm ring-1 ring-black/10 hover:bg-white"
          aria-label="Previous image"
          type="button"
        >
          <FiChevronLeft className="h-5 w-5" style={{ color: PALETTE.navy }} />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-white/95 p-2 shadow-sm ring-1 ring-black/10 hover:bg-white"
          aria-label="Next image"
          type="button"
        >
          <FiChevronRight className="h-5 w-5" style={{ color: PALETTE.navy }} />
        </button>

        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="h-2.5 cursor-pointer rounded-full transition-all motion-reduce:transition-none"
              style={{
                width: i === idx ? 28 : 10,
                backgroundColor: i === idx ? "white" : "rgba(255,255,255,.6)",
              }}
              aria-label={`Go to image ${i + 1}`}
              type="button"
            />
          ))}
        </div>
      </div>

      <div className="mt-3 hidden grid-cols-6 gap-2 sm:grid">
        {images.slice(0, 6).map((src, i) => (
          <Thumb key={src + i} src={src} active={i === idx} onClick={() => setIdx(i)} />
        ))}
      </div>

      <div
        ref={wrapRef}
        className={cn(
          "hide-scrollbar mt-3 flex gap-2 overflow-x-auto sm:hidden",
          "[scrollbar-width:none]",
          "[-ms-overflow-style:none]"
        )}
      >
        <style>{`.hide-scrollbar::-webkit-scrollbar{display:none;}`}</style>
        {images.slice(0, 8).map((src, i) => (
          <button
            key={src + i}
            data-i={i}
            onClick={() => setIdx(i)}
            className={cn(
              "shrink-0 cursor-pointer overflow-hidden rounded-2xl ring-1",
              i === idx ? "ring-black/20" : "ring-black/10"
            )}
            type="button"
          >
            <img src={src} alt="" className="h-14 w-14 object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

function SpecRow({ k, v }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="text-xs font-black text-slate-600">{k}</div>
      <div className="text-right text-xs font-semibold text-slate-900">{v}</div>
    </div>
  );
}

function ReviewCard({ r }) {
  return (
    <div
      className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm"
      style={{ boxShadow: "0 12px 30px rgba(0,31,63,.06)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
            {r.name}
          </div>
          <div className="mt-1">
            <Stars value={r.rating} />
          </div>
        </div>
        <Chip tone="soft">{r.date}</Chip>
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-700">{r.text}</div>
      {r.verified ? (
        <div className="mt-3 inline-flex items-center gap-2 text-xs font-black" style={{ color: PALETTE.navy }}>
          <FiCheckCircle style={{ color: PALETTE.gold }} />
          Verified purchase
        </div>
      ) : null}
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative cursor-pointer px-2 py-3 text-sm font-black transition",
        active ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
      )}
      type="button"
    >
      {children}
      <span
        className={cn("absolute left-0 right-0 -bottom-[1px] h-[2px] transition", active ? "opacity-100" : "opacity-0")}
        style={{ background: PALETTE.coral }}
      />
    </button>
  );
}

function RelatedProductCard({ item }) {
  return (
    <button
      type="button"
      className={cn(
        "group shrink-0 cursor-pointer text-left transition hover:-translate-y-[1px]",
        "w-[240px] sm:w-[260px] lg:w-[280px]"
      )}
      onClick={() => item?.onClick?.(item)}
    >
      <div
        className="rounded-[1.75rem] border border-black/5 bg-white p-3 shadow-sm ring-1 ring-black/5"
        style={{ boxShadow: "0 12px 30px rgba(0,31,63,.06)" }}
      >
        <div className="overflow-hidden rounded-[1.35rem] ring-1 ring-black/5">
          <img
            src={item.image}
            alt={item.title}
            className="h-44 w-full object-cover transition group-hover:scale-[1.02]"
            loading="lazy"
          />
        </div>

        <div className="mt-3 line-clamp-2 text-sm font-black text-slate-900">{item.title}</div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm font-black" style={{ color: PALETTE.cta }}>
            {formatBDT(item.priceBDT)}
          </div>
          <div className="inline-flex items-center gap-1">
            <FiStar className="h-4 w-4" style={{ color: PALETTE.gold, fill: PALETTE.gold }} />
            <span className="text-xs font-black text-slate-700">{(item.rating ?? 4.6).toFixed(1)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function useSliderControls() {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft < maxScroll - 2);
  }, []);

  const scrollByAmount = useCallback((dir) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.max(340, Math.floor(el.clientWidth * 0.7));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    updateButtons();

    const onScroll = () => updateButtons();
    el.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => updateButtons();
    window.addEventListener("resize", onResize);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [updateButtons]);

  return { trackRef, canLeft, canRight, scrollByAmount };
}

function RelatedProductsSliderTrack({ items, trackRef }) {
  return (
    <div
      ref={trackRef}
      className={cn(
        "hide-scrollbar flex gap-4 overflow-x-auto px-2 py-1",
        "[scrollbar-width:none]",
        "[-ms-overflow-style:none]",
        "scroll-smooth"
      )}
      style={{
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none;}`}</style>
      {items.map((item) => (
        <div key={item.id} style={{ scrollSnapAlign: "start" }}>
          <RelatedProductCard item={item} />
        </div>
      ))}
    </div>
  );
}

function ArrowGroup({ canLeft, canRight, onLeft, onRight }) {
  const Btn = ({ disabled, onClick, children, label }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full border transition",
        disabled
          ? "cursor-not-allowed border-black/10 bg-white/70 opacity-60"
          : "cursor-pointer border-black/10 bg-white hover:bg-slate-50"
      )}
      style={{ boxShadow: "0 10px 22px rgba(0,31,63,.08)" }}
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center gap-2">
      <Btn disabled={!canLeft} onClick={onLeft} label="Scroll left">
        <FiChevronLeft className="h-5 w-5" style={{ color: PALETTE.navy }} />
      </Btn>
      <Btn disabled={!canRight} onClick={onRight} label="Scroll right">
        <FiChevronRight className="h-5 w-5" style={{ color: PALETTE.navy }} />
      </Btn>
    </div>
  );
}

function ProductActions() {
  return (
    <div className="flex items-center gap-2">
      <button
        className="cursor-pointer rounded-full bg-white p-2.5 shadow-sm ring-1 ring-black/10 hover:bg-slate-50"
        aria-label="Wishlist"
        type="button"
      >
        <FiHeart className="h-5 w-5" style={{ color: PALETTE.cta }} />
      </button>
      <button
        className="cursor-pointer rounded-full bg-white p-2.5 shadow-sm ring-1 ring-black/10 hover:bg-slate-50"
        aria-label="Share"
        type="button"
      >
        <FiShare2 className="h-5 w-5" style={{ color: PALETTE.navy }} />
      </button>
    </div>
  );
}

export default function ProductDetailsPage({ product }) {
  const p = product || {
    id: "T4",
    title: "KOSPET TANK T4 Smartwatch with 10 ATM",
    category: "Smart Watches",
    priceBDT: 17999,
    oldPriceBDT: 18999,
    discountPercent: 6,
    badges: { trending: true },
  };

  const galleryImages = useMemo(() => {
    const base = p.image ? [p.image] : [];
    const extras = (p.images && p.images.length ? p.images : []).filter(Boolean);
    const more = [
      "https://images.unsplash.com/photo-1511381939415-c1c4d6e1d8e0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516139008210-96e45dccd83b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518441902117-f0a3a0a0180a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
    ];
    const merged = [...base, ...extras, ...more].slice(0, 6);
    while (merged.length < 4) merged.push(more[merged.length % more.length]);
    return merged;
  }, [p.image, p.images]);

  const rating = p.rating ?? 4.6;
  const reviewCount = p.reviewCount ?? 128;

  const [qty, setQty] = useState(1);
  const [color, setColor] = useState((p.colors && p.colors[0]) || "Black");
  const colors = p.colors ?? ["Black", "Silver"];

  const rightFeatures =
    p.rightFeatures ?? [
      "1.4” AMOLED display with AOD",
      "GPS (Offline Map)",
      "32GB Internal Music Storage",
      "10 ATM & IP69K Waterproof Rating",
      "500mAh Battery (pure cobalt Battery)",
      "Bangla Support",
      "160+ Professional Sports Modes",
      "1 Year Brand Warranty",
    ];

  const emiFrom = p.emiFrom ?? 621.07;

  const specs =
    p.specs ?? {
      Brand: "KOSPET",
      Model: "TANK T4",
      Waterproof: "10 ATM / IP69K",
      Display: "1.4” AMOLED",
      Storage: "32GB",
      Warranty: "1 Year",
    };

  const description =
    p.description ??
    "Premium rugged smartwatch with AMOLED display, GPS support and strong waterproof rating. Great battery backup and sports modes for daily use.";

  const reviews =
    p.reviews ?? [
      { name: "Ahsan R.", rating: 5, date: "2 days ago", text: "Packaging was premium and delivery was fast.", verified: true },
      { name: "Nusrat T.", rating: 4.5, date: "1 week ago", text: "Looks exactly like the photos.", verified: true },
      { name: "Farhan S.", rating: 4, date: "3 weeks ago", text: "Good value for the price.", verified: false },
    ];

  const relatedProducts =
    p.relatedProducts ??
    [
      {
        id: "R1",
        title: "KOSPET Rugged Smartwatch (AMOLED) – GPS + Sports Modes",
        priceBDT: 16499,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: "R2",
        title: "Premium Smartwatch – Long Battery + Waterproof",
        priceBDT: 13999,
        rating: 4.4,
        image: "https://images.unsplash.com/photo-1518441902117-f0a3a0a0180a?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: "R3",
        title: "Sport Watch – GPS Tracking + 100+ Modes",
        priceBDT: 12499,
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1511381939415-c1c4d6e1d8e0?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: "R4",
        title: "Smartwatch – AMOLED Display + Music Storage",
        priceBDT: 15499,
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: "R5",
        title: "Rugged Watch – Waterproof + Compass",
        priceBDT: 14999,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1516139008210-96e45dccd83b?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: "R6",
        title: "Smart Watch – Fitness + Heart Rate + Sleep Tracking",
        priceBDT: 9999,
        rating: 4.3,
        image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: "R7",
        title: "AMOLED Watch – Always On Display + Multi Sports",
        priceBDT: 16999,
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: "R8",
        title: "Rugged Smartwatch – 10 ATM Waterproof + GPS",
        priceBDT: 17499,
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
      },
    ];

  const [tab, setTab] = useState("specification");

  const { trackRef, canLeft, canRight, scrollByAmount } = useSliderControls();

  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,31,63,.10), rgba(255,126,105,.10), rgba(234,179,8,.08), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <Gallery images={galleryImages} title={p.title} />

          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {p.tag ? (
                    <Chip tone="navy">
                      <FiTag style={{ color: PALETTE.gold }} />
                      {p.tag}
                    </Chip>
                  ) : null}
                  {p.badges?.trending ? <Chip tone="coral">Trending</Chip> : null}
                  {p.badges?.new ? <Chip tone="gold">New arrival</Chip> : null}
                  <Chip tone="soft">In stock</Chip>
                </div>

                <ProductActions />
              </div>

              <div className="mt-3 text-[20px] font-black tracking-tight text-slate-900">{p.title}</div>
              <div className="mt-1 text-xs font-bold" style={{ color: PALETTE.coral }}>
                {p.category}
              </div>

              <div className="mt-4 space-y-2">
                {rightFeatures.slice(0, 8).map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/5">
                      <FiCheckCircle className="h-4 w-4" style={{ color: PALETTE.navy }} />
                    </span>
                    <div className="text-sm font-semibold text-slate-700">{f}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-2xl font-black" style={{ color: PALETTE.cta }}>
                    {formatBDT(p.priceBDT)}
                  </div>
                  {p.oldPriceBDT ? (
                    <div className="text-sm font-black text-slate-400 line-through">{formatBDT(p.oldPriceBDT)}</div>
                  ) : null}
                  {p.discountPercent ? (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-black"
                      style={{ background: "rgba(255,107,107,.14)", color: PALETTE.cta }}
                    >
                      {p.discountPercent}% OFF
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Stars value={rating} />
                  <span className="text-xs font-black text-slate-900">{rating.toFixed(1)}</span>
                  <span className="text-xs font-semibold text-slate-500">({reviewCount})</span>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-neutral-50 p-4 ring-1 ring-black/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-black text-slate-700">EMIs From:</div>
                  <div className="text-xs font-black text-slate-900">
                    ৳ {emiFrom.toFixed(2)}/month <span className="ml-2 text-xs font-semibold text-slate-500">Details</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-black text-slate-700">Color:</div>
                  <div className="flex items-center gap-2">
                    {colors.map((c) => {
                      const active = color === c;
                      const dot =
                        c.toLowerCase().includes("black")
                          ? "#0b0f19"
                          : c.toLowerCase().includes("silver") || c.toLowerCase().includes("white")
                          ? "#d1d5db"
                          : "#94a3b8";
                      return (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          className={cn(
                            "h-9 w-9 cursor-pointer rounded-xl ring-1 transition",
                            active ? "ring-black/30" : "ring-black/10 hover:ring-black/20"
                          )}
                          style={{ background: dot }}
                          aria-label={`Select color ${c}`}
                          type="button"
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-white p-3 ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black" style={{ color: PALETTE.navy }}>
                    Quantity
                  </div>
                  <div className="text-xs font-semibold text-slate-500">Max 5</div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-neutral-50 p-2 ring-1 ring-black/5">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="cursor-pointer rounded-xl bg-white p-2 ring-1 ring-black/10 hover:bg-slate-50"
                      aria-label="Decrease"
                      type="button"
                    >
                      <FiMinus />
                    </button>
                    <div className="w-10 text-center text-sm font-black text-slate-900">{qty}</div>
                    <button
                      onClick={() => setQty((q) => Math.min(5, q + 1))}
                      className="cursor-pointer rounded-xl bg-white p-2 ring-1 ring-black/10 hover:bg-slate-50"
                      aria-label="Increase"
                      type="button"
                    >
                      <FiPlus />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-500">Total</div>
                    <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
                      {formatBDT((p.priceBDT || 0) * qty)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  className="cursor-pointer rounded-2xl px-4 py-3 text-sm font-black text-white shadow-sm active:scale-[0.99]"
                  style={{ backgroundColor: PALETTE.navy }}
                  type="button"
                >
                  Add To Cart
                </button>
                <button
                  className="cursor-pointer rounded-2xl px-4 py-3 text-sm font-black text-white shadow-sm active:scale-[0.99]"
                  style={{ backgroundColor: PALETTE.cta }}
                  type="button"
                >
                  Buy Now
                </button>
              </div>

              <FeatureRow />

              <div className="mt-4 flex items-start gap-2 rounded-2xl bg-white p-3 ring-1 ring-black/5">
                <FiInfo className="mt-0.5 h-4 w-4" style={{ color: PALETTE.coral }} />
                <div className="text-xs font-semibold text-slate-600">
                  Selected: <span className="font-black text-slate-900">{color}</span> • Qty{" "}
                  <span className="font-black text-slate-900">{qty}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 rounded-[1.75rem] border border-black/5 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-6 border-b border-black/5 px-5">
            <TabButton active={tab === "specification"} onClick={() => setTab("specification")}>
              Specification
            </TabButton>
            <TabButton active={tab === "description"} onClick={() => setTab("description")}>
              Description
            </TabButton>
            <TabButton active={tab === "reviews"} onClick={() => setTab("reviews")}>
              Reviews
            </TabButton>
            <TabButton active={tab === "questions"} onClick={() => setTab("questions")}>
              Questions
            </TabButton>
            <TabButton active={tab === "video"} onClick={() => setTab("video")}>
              Video
            </TabButton>
          </div>

          <div className="p-5">
            {tab === "specification" ? (
              <div className="grid gap-5 lg:grid-cols-[1fr_.9fr]">
                <div className="rounded-3xl bg-white ring-1 ring-black/5">
                  <div className="p-4">
                    <SectionTitle title="Specifications" />
                    <div className="divide-y divide-black/5">
                      {Object.entries(specs).map(([k, v]) => (
                        <SpecRow key={k} k={k} v={String(v)} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-neutral-50 p-4 ring-1 ring-black/5">
                  <SectionTitle title="Key Points" />
                  <ul className="space-y-2">
                    {rightFeatures.slice(0, 6).map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <FiCheckCircle className="mt-0.5 h-4 w-4" style={{ color: PALETTE.gold }} />
                        <div className="text-sm font-semibold text-slate-700">{h}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            {tab === "description" ? (
              <div className="rounded-3xl bg-white p-4 ring-1 ring-black/5">
                <SectionTitle title="Description" />
                <p className="text-sm font-semibold leading-6 text-slate-700">{description}</p>
              </div>
            ) : null}

            {tab === "reviews" ? (
              <div>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-lg font-black" style={{ color: PALETTE.navy }}>
                      Reviews
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Stars value={rating} />
                      <span className="text-sm font-black text-slate-900">{rating.toFixed(1)}</span>
                      <span className="text-xs font-semibold text-slate-500">({reviewCount})</span>
                    </div>
                  </div>

                  <button
                    className="cursor-pointer rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black text-slate-900 shadow-sm hover:bg-slate-50"
                    type="button"
                  >
                    Write a review
                  </button>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  {reviews.slice(0, 6).map((r, i) => (
                    <ReviewCard key={i} r={r} />
                  ))}
                </div>
              </div>
            ) : null}

            {tab === "questions" ? (
              <div className="rounded-3xl bg-neutral-50 p-4 ring-1 ring-black/5">
                <SectionTitle title="Questions" />
                <div className="text-sm font-semibold text-slate-700">
                  No questions yet. Be the first to ask about this product.
                </div>
              </div>
            ) : null}

            {tab === "video" ? (
              <div className="rounded-3xl bg-neutral-50 p-4 ring-1 ring-black/5">
                <SectionTitle title="Video" />
                <div className="text-sm font-semibold text-slate-700">Video content not available right now.</div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Related products slider */}
        <section className="mt-8">
          <div className="rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-black" style={{ color: PALETTE.navy }}>
                  Related Products
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-500">You may also like these items</div>
              </div>

              <ArrowGroup
                canLeft={canLeft}
                canRight={canRight}
                onLeft={() => scrollByAmount(-1)}
                onRight={() => scrollByAmount(1)}
              />
            </div>

            <div className="mt-5">
              <RelatedProductsSliderTrack items={relatedProducts} trackRef={trackRef} />
            </div>
          </div>
        </section>

        {/* Bottom info bar */}
        <div className="mt-8 rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { Icon: FiShield, title: "100% secure", desc: "Trusted payments and verified checkout." },
              { Icon: FiTruck, title: "Fast delivery", desc: "Quick dispatch with careful packaging." },
              { Icon: FiRefreshCcw, title: "Easy return", desc: "7 days return policy (conditions apply)." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 rounded-3xl bg-neutral-50 p-4 ring-1 ring-black/5">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-black/5"
                  style={{ background: "rgba(0,31,63,.06)" }}
                >
                  <Icon className="h-5 w-5" style={{ color: PALETTE.navy }} />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">{title}</div>
                  <div className="mt-0.5 text-xs font-semibold text-slate-500">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
