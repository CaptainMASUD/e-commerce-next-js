"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useNav from "@/Components/Utils/useNav";
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
} from "react-icons/fi";

const PALETTE = {
  navy: "#001f3f",
  navySoft: "#0b2d57",
  coral: "#ff7e69",
  coralSoft: "rgba(255,126,105,.12)",
  gold: "#eab308",
  green: "#16a34a",
  greenSoft: "rgba(22,163,74,.10)",
  bg: "#f8fafc",
  text: "#0f172a",
  muted: "#64748b",
  border: "rgba(0,31,63,.08)",
  danger: "#ef4444",
  dangerDark: "#dc2626",
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatBDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function getImageUrl(img) {
  if (!img) return "";
  if (typeof img === "string") return img.trim();
  if (typeof img === "object" && img.url) return String(img.url).trim();
  return "";
}

function getVariantFinalPrice(variant) {
  if (!variant) return 0;
  const sale = typeof variant.salePrice === "number" ? variant.salePrice : null;
  const base = typeof variant.price === "number" ? variant.price : 0;
  return sale !== null ? sale : base;
}

function getProductFinalPrice(product) {
  return typeof product?.finalPrice === "number"
    ? product.finalPrice
    : typeof product?.price === "number"
      ? product.price
      : 0;
}

function getDiscountPercent(oldPrice, finalPrice) {
  const oldP = Number(oldPrice || 0);
  const finalP = Number(finalPrice || 0);
  if (!oldP || !finalP || finalP >= oldP) return 0;
  return Math.round(((oldP - finalP) / oldP) * 100);
}

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
    coral: { bg: PALETTE.coralSoft, fg: PALETTE.navy },
    gold: { bg: "rgba(234,179,8,.16)", fg: PALETTE.navy },
    soft: { bg: "rgba(0,31,63,.05)", fg: PALETTE.navy },
    danger: { bg: "rgba(239,68,68,.12)", fg: "#b91c1c" },
    success: { bg: PALETTE.greenSoft, fg: PALETTE.green },
  };

  const t = map[tone] || map.soft;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-black/5"
      style={{ background: t.bg, color: t.fg }}
    >
      {children}
    </span>
  );
}

function OptionPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full px-4 py-2 text-sm transition ring-1",
        active
          ? "text-white shadow-sm"
          : "bg-white text-slate-700 ring-black/10 hover:bg-slate-50 hover:ring-black/20",
      )}
      style={
        active
          ? {
              backgroundColor: PALETTE.navy,
              borderColor: PALETTE.navy,
            }
          : {}
      }
    >
      {children}
    </button>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="mb-4">
      <div className="text-lg font-bold" style={{ color: PALETTE.navy }}>
        {title}
      </div>
      <div className="mt-3 h-px w-full bg-black/10" />
    </div>
  );
}

function Thumb({ src, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative cursor-pointer shrink-0 overflow-hidden rounded-2xl bg-white transition-all",
        active ? "ring-2 ring-offset-2" : "ring-1 ring-black/10 hover:ring-black/20",
      )}
      style={{
        border: active ? `1px solid ${PALETTE.coral}` : "1px solid transparent",
        boxShadow: "none",
      }}
      aria-label="Select image"
      type="button"
    >
      <div className="h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20 bg-white p-2">
        <img src={src} alt="" className="h-full w-full object-contain" loading="lazy" />
      </div>
    </button>
  );
}

function StockRibbon({ show }) {
  if (!show) return null;

  return (
    <div className="pointer-events-none absolute right-0 top-0 z-20 overflow-hidden">
      <div
        className="translate-x-[28px] translate-y-[16px] rotate-45 px-16 py-2 text-[12px] font-bold uppercase tracking-[0.2em] text-white sm:px-20"
        style={{
          background: "linear-gradient(135deg, #dc2626, #ef4444)",
        }}
      >
        Out of Stock
      </div>
    </div>
  );
}

function MagnifierSlide({
  src,
  alt,
  active,
  zoom = 2.6,
  lensSize = 120,
  containerHeightClass = "h-[260px] sm:h-[320px] lg:h-[360px]",
  soldOut = false,
}) {
  const wrapRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ xPct: 50, yPct: 50, xPx: 0, yPx: 0 });

  const isMobileViewport = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 640;
  }, []);

  const lockBodyScroll = useCallback(() => {
    if (typeof document === "undefined" || !isMobileViewport()) return;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.touchAction = "none";
  }, [isMobileViewport]);

  const unlockBodyScroll = useCallback(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
    document.documentElement.style.overflow = "";
    document.documentElement.style.touchAction = "";
  }, []);

  useEffect(() => {
    return () => {
      unlockBodyScroll();
    };
  }, [unlockBodyScroll]);

  const updateFromEvent = useCallback((e) => {
    const el = wrapRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches?.[0]?.clientX : e.clientX;
    const clientY = "touches" in e ? e.touches?.[0]?.clientY : e.clientY;

    if (typeof clientX !== "number" || typeof clientY !== "number") return;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const cx = Math.max(0, Math.min(rect.width, x));
    const cy = Math.max(0, Math.min(rect.height, y));

    const xPct = (cx / rect.width) * 100;
    const yPct = (cy / rect.height) * 100;

    setPos({ xPct, yPct, xPx: cx, yPx: cy });
  }, []);

  const show = active && hovered && !soldOut;

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative w-full min-w-full shrink-0 select-none overflow-hidden bg-white p-4",
        containerHeightClass,
      )}
      style={{
        background:
          "linear-gradient(to bottom, rgba(0,31,63,.04), rgba(255,126,105,.04), transparent)",
        touchAction: show && isMobileViewport() ? "none" : "auto",
      }}
      onMouseEnter={(e) => {
        setHovered(true);
        updateFromEvent(e);
      }}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={updateFromEvent}
      onTouchStart={(e) => {
        lockBodyScroll();
        setHovered(true);
        updateFromEvent(e);
      }}
      onTouchMove={(e) => {
        if (isMobileViewport()) e.preventDefault();
        updateFromEvent(e);
      }}
      onTouchEnd={() => {
        setHovered(false);
        unlockBodyScroll();
      }}
      onTouchCancel={() => {
        setHovered(false);
        unlockBodyScroll();
      }}
    >
      <img
        src={src}
        alt={alt}
        className={cn("h-full w-full object-contain", soldOut ? "grayscale-[22%] opacity-80" : "")}
        loading="eager"
        draggable={false}
      />

      {show ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

          <div
            className="pointer-events-none absolute rounded-2xl ring-2"
            style={{
              width: lensSize,
              height: lensSize,
              left: pos.xPx - lensSize / 2,
              top: pos.yPx - lensSize / 2,
              background: "rgba(255,255,255,.08)",
              borderColor: "rgba(255,255,255,.65)",
              backdropFilter: "blur(3px)",
              transform: "translateZ(0)",
            }}
          >
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                backgroundImage: `url(${src})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: `${zoom * 100}% ${zoom * 100}%`,
                backgroundPosition: `${pos.xPct}% ${pos.yPct}%`,
                borderRadius: 16,
                opacity: 0.98,
              }}
            />
          </div>
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
      )}
    </div>
  );
}

function Gallery({ images, title, inStock }) {
  const [idx, setIdx] = useState(0);
  const thumbsWrapRef = useRef(null);

  useEffect(() => {
    setIdx(0);
  }, [images?.join("|")]);

  const prev = useCallback(() => {
    setIdx((p) => (p - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setIdx((p) => (p + 1) % images.length);
  }, [images.length]);

  const scrollThumbIntoView = useCallback((index) => {
    const el = thumbsWrapRef.current;
    if (!el) return;
    const child = el.querySelector(`[data-thumb-i='${index}']`);
    if (!child) return;
    child.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  }, []);

  useEffect(() => {
    scrollThumbIntoView(idx);
  }, [idx, scrollThumbIntoView]);

  const scrollThumbs = useCallback((direction) => {
    const el = thumbsWrapRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.75, 180);
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  if (!images.length) return null;

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-[1.75rem] border border-black/5 bg-white p-3">
      <div className="relative w-full max-w-full overflow-hidden rounded-[1.35rem] ring-1 ring-black/5">
        <StockRibbon show={!inStock} />

        <div className="relative w-full min-w-0 max-w-full overflow-hidden">
          <div
            className="flex w-full min-w-0 max-w-full will-change-transform transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${idx * 100}%)` }}
          >
            {images.map((src, i) => (
              <MagnifierSlide
                key={src + i}
                src={src}
                alt={title}
                active={i === idx}
                soldOut={!inStock}
              />
            ))}
          </div>
        </div>

        {images.length > 1 ? (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-white/95 p-2 ring-1 ring-black/10"
              aria-label="Previous image"
              type="button"
            >
              <FiChevronLeft className="h-5 w-5" style={{ color: PALETTE.navy }} />
            </button>

            <button
              onClick={next}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-white/95 p-2 ring-1 ring-black/10"
              aria-label="Next image"
              type="button"
            >
              <FiChevronRight className="h-5 w-5" style={{ color: PALETTE.navy }} />
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="relative mt-4 w-full max-w-full">
          <button
            type="button"
            onClick={() => scrollThumbs("left")}
            className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow-sm ring-1 ring-black/10 md:flex"
            aria-label="Scroll thumbnails left"
          >
            <FiChevronLeft className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </button>

          <div
            ref={thumbsWrapRef}
            className={cn(
              "hide-scrollbar flex w-full max-w-full gap-3 overflow-x-auto scroll-smooth px-0 md:px-10",
              "[scrollbar-width:none]",
              "[-ms-overflow-style:none]",
            )}
          >
            <style>{`
              .hide-scrollbar::-webkit-scrollbar{display:none;}
            `}</style>

            {images.map((src, i) => (
              <div key={src + i} data-thumb-i={i} className="shrink-0">
                <Thumb src={src} active={i === idx} onClick={() => setIdx(i)} />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollThumbs("right")}
            className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow-sm ring-1 ring-black/10 md:flex"
            aria-label="Scroll thumbnails right"
          >
            <FiChevronRight className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ProductActions() {
  return (
    <div className="flex items-center gap-2">
      <button
        className="cursor-pointer rounded-full bg-white p-2.5 ring-1 ring-black/10 hover:bg-slate-50"
        aria-label="Wishlist"
        type="button"
      >
        <FiHeart className="h-5 w-5" style={{ color: PALETTE.coral }} />
      </button>
      <button
        className="cursor-pointer rounded-full bg-white p-2.5 ring-1 ring-black/10 hover:bg-slate-50"
        aria-label="Share"
        type="button"
      >
        <FiShare2 className="h-5 w-5" style={{ color: PALETTE.navy }} />
      </button>
    </div>
  );
}

function SpecRow({ k, v }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="text-xs font-semibold text-slate-600">{k}</div>
      <div className="text-right text-xs font-medium text-slate-900">{v}</div>
    </div>
  );
}

function buildVariantGroups(variants) {
  const groupMap = {};

  variants.forEach((variant) => {
    const attrs = variant?.attributes || {};
    const entries =
      attrs instanceof Map ? Array.from(attrs.entries()) : Object.entries(attrs || {});

    entries.forEach(([key, value]) => {
      const k = String(key || "").trim();
      const v = String(value || "").trim();
      if (!k || !v) return;
      if (!groupMap[k]) groupMap[k] = new Set();
      groupMap[k].add(v);
    });
  });

  return Object.entries(groupMap).map(([name, set]) => ({
    name,
    options: Array.from(set),
  }));
}

function findMatchingVariant(variants, selectedAttributes) {
  return (
    variants.find((variant) => {
      const attrs = variant?.attributes || {};
      const entries =
        attrs instanceof Map ? Object.fromEntries(attrs.entries()) : { ...attrs };

      return Object.entries(selectedAttributes).every(
        ([key, value]) => String(entries?.[key] || "") === String(value || ""),
      );
    }) || null
  );
}

function normalizeFeatures(features) {
  return [...features].sort((a, b) => {
    const ao = Number(a?.order || 0);
    const bo = Number(b?.order || 0);
    return ao - bo;
  });
}

export default function ProductDetailsUI({
  product,
  onBack,
  relatedProducts = [],
  onSelectRelated,
}) {
  const nav = useNav();
  const p = product || {};

  const title = p?.title || "Product";
  const categoryLabel = p?.category?.name || "";
  const brandLabel = p?.brand?.name || "";
  const subcategoryLabel = p?.subcategory?.name || "";

  const basePrimary = getImageUrl(p?.primaryImage) || "/placeholder.png";

  const variants = useMemo(
    () => (Array.isArray(p?.variants) ? p.variants.filter((v) => v?.isActive !== false) : []),
    [p?.variants],
  );

  const variantGroups = useMemo(() => buildVariantGroups(variants), [variants]);
  const [selectedAttributes, setSelectedAttributes] = useState({});

  useEffect(() => {
    const init = {};
    variantGroups.forEach((group) => {
      init[group.name] = group.options[0];
    });
    setSelectedAttributes(init);
  }, [variantGroups]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    if (!variantGroups.length) return variants[0] || null;
    return findMatchingVariant(variants, selectedAttributes) || variants[0] || null;
  }, [variants, variantGroups, selectedAttributes]);

  const galleryImages = useMemo(() => {
    const urls = [];
    const add = (u) => {
      const s = String(u || "").trim();
      if (!s) return;
      if (!urls.includes(s)) urls.push(s);
    };

    if (selectedVariant?.images?.length) {
      selectedVariant.images.forEach((img) => add(getImageUrl(img)));
    } else {
      add(basePrimary);
      (Array.isArray(p?.galleryImages) ? p.galleryImages : []).forEach((img) =>
        add(getImageUrl(img)),
      );
    }

    if (!urls.length) add("/placeholder.png");
    return urls.slice(0, 20);
  }, [selectedVariant, basePrimary, p?.galleryImages]);

  const displayPrice = useMemo(() => {
    if (selectedVariant) {
      const oldPrice = toNum(selectedVariant?.price);
      const finalPrice = getVariantFinalPrice(selectedVariant);
      return {
        oldPrice: oldPrice > finalPrice ? oldPrice : null,
        finalPrice,
      };
    }

    const finalPrice = getProductFinalPrice(p);
    const oldPrice =
      typeof p?.price === "number" && p.price > finalPrice ? p.price : null;

    return { oldPrice, finalPrice };
  }, [selectedVariant, p]);

  const stockQty = selectedVariant
    ? toNum(selectedVariant?.stockQty)
    : toNum(p?.availableStock);

  const inStock = stockQty > 0;
  const discountPercent = getDiscountPercent(displayPrice.oldPrice, displayPrice.finalPrice);

  const isNew = !!p?.isNew;
  const isTrending = !!p?.isTrending;

  const rating = 4.6;
  const reviewCount = 128;

  const features = useMemo(
    () => normalizeFeatures(Array.isArray(p?.features) ? p.features : []),
    [p?.features],
  );

  const keyFeatures = useMemo(() => {
    const keys = features.filter((f) => f?.isKey);
    return keys.length ? keys : features.slice(0, 6);
  }, [features]);

  const specs = useMemo(() => {
    const all = {};

    if (brandLabel) all.Brand = brandLabel;
    if (categoryLabel) all.Category = categoryLabel;
    if (subcategoryLabel) all.Subcategory = subcategoryLabel;
    if (p?.productType) all.Type = p.productType;

    features.forEach((item, index) => {
      const label = String(item?.label || `Spec ${index + 1}`).trim();
      const value = String(item?.value || "").trim();
      if (!label || !value) return;
      all[label] = value;
    });

    return all;
  }, [brandLabel, categoryLabel, subcategoryLabel, p?.productType, features]);

  const descriptionBlocks = useMemo(() => {
    return Array.isArray(p?.description)
      ? [...p.description].sort((a, b) => (a?.order || 0) - (b?.order || 0))
      : [];
  }, [p?.description]);

  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("specification");

  const handleSelectRelated = useCallback(
    (it) => {
      if (typeof onSelectRelated === "function") return onSelectRelated(it);
      const slug = it?.slug || it?._id || it?.id;
      if (slug) nav.push?.(`/product/${slug}`);
    },
    [onSelectRelated, nav],
  );

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: PALETTE.bg }}
    >
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,31,63,.08), rgba(255,126,105,.08), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="min-w-0">
            <Gallery images={galleryImages} title={title} inStock={inStock} />
          </div>

          <div className="min-w-0 space-y-4">
            <div className="rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {isTrending ? <Chip tone="coral">Trending</Chip> : null}
                  {isNew ? <Chip tone="gold">New arrival</Chip> : null}
                  {p?.tags?.[0] ? (
                    <Chip tone="navy">
                      <FiTag style={{ color: PALETTE.gold }} />
                      {p.tags[0]}
                    </Chip>
                  ) : null}

                  {inStock ? (
                    <Chip tone="success">In stock • {stockQty} left</Chip>
                  ) : (
                    <Chip tone="danger">Out of stock</Chip>
                  )}
                </div>

                <ProductActions />
              </div>

              <div className="mt-4 text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.6rem]">
                {title}
              </div>

              <div className="mt-3 text-sm font-medium text-slate-600 sm:text-base">
                {categoryLabel}
                {subcategoryLabel ? ` • ${subcategoryLabel}` : ""}
                {brandLabel ? ` • ${brandLabel}` : ""}
              </div>

              {keyFeatures.length ? (
                <div className="mt-5 space-y-2">
                  {keyFeatures.slice(0, 8).map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span
                        className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full"
                        style={{ background: PALETTE.coralSoft }}
                      >
                        <FiCheckCircle className="h-4 w-4" style={{ color: PALETTE.navy }} />
                      </span>
                      <div className="text-sm font-medium text-slate-700 sm:text-[15px]">
                        <span className="font-semibold text-slate-900">{f?.label}</span>: {f?.value}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-2xl font-semibold sm:text-3xl" style={{ color: PALETTE.navy }}>
                    {formatBDT(displayPrice.finalPrice)}
                  </div>

                  {displayPrice.oldPrice ? (
                    <div className="text-sm font-medium text-slate-400 line-through sm:text-base">
                      {formatBDT(displayPrice.oldPrice)}
                    </div>
                  ) : null}

                  {discountPercent ? (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold sm:text-sm"
                      style={{
                        background: "rgba(255,126,105,.14)",
                        color: PALETTE.navy,
                      }}
                    >
                      {discountPercent}% OFF
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Stars value={rating} />
                  <span className="text-xs font-semibold text-slate-900 sm:text-sm">
                    {Number(rating).toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-500 sm:text-sm">({reviewCount})</span>
                </div>
              </div>

              {variantGroups.length ? (
                <div className="mt-5 rounded-2xl border border-black/5 bg-white p-4">
                  <div className="space-y-4">
                    {variantGroups.map((group) => (
                      <div key={group.name}>
                        <div className="mb-2 text-xs font-medium capitalize text-slate-600 sm:text-sm">
                          {group.name}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {group.options.map((opt) => {
                            const active = selectedAttributes[group.name] === opt;
                            return (
                              <OptionPill
                                key={opt}
                                active={active}
                                onClick={() =>
                                  setSelectedAttributes((prev) => ({
                                    ...prev,
                                    [group.name]: opt,
                                  }))
                                }
                              >
                                {opt}
                              </OptionPill>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedVariant ? (
                    <div className="mt-4 rounded-2xl bg-neutral-50 p-3 ring-1 ring-black/5">
                      <div className="text-xs font-medium text-slate-500 sm:text-sm">Selected option</div>
                      <div className="mt-1 text-sm font-medium text-slate-900 sm:text-base">
                        {Object.entries(
                          selectedVariant?.attributes instanceof Map
                            ? Object.fromEntries(selectedVariant.attributes.entries())
                            : selectedVariant?.attributes || {},
                        )
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" • ")}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-4 rounded-2xl bg-white p-3 ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold sm:text-base" style={{ color: PALETTE.navy }}>
                    Quantity
                  </div>
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

                    <div className="min-w-[48px] text-center text-sm font-semibold text-slate-900 sm:text-base">
                      {qty}
                    </div>

                    <button
                      onClick={() => setQty((q) => q + 1)}
                      className="cursor-pointer rounded-xl bg-white p-2 ring-1 ring-black/10 hover:bg-slate-50"
                      aria-label="Increase"
                      type="button"
                    >
                      <FiPlus />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-500 sm:text-sm">Total</div>
                    <div
                      className="inline-flex rounded-full px-3 py-1 text-sm font-semibold sm:text-base"
                      style={{
                        color: PALETTE.green,
                        background: PALETTE.greenSoft,
                      }}
                    >
                      {formatBDT(displayPrice.finalPrice * qty)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  className="cursor-pointer rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                  style={{ backgroundColor: PALETTE.navy }}
                  type="button"
                  disabled={!inStock}
                >
                  Add To Cart
                </button>

                <button
                  className="cursor-pointer rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                  style={{
                    background: `linear-gradient(135deg, ${PALETTE.coral}, #f96d57)`,
                  }}
                  type="button"
                  disabled={!inStock}
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[1.75rem] border border-black/5 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-6 border-b border-black/5 px-5">
            <button
              type="button"
              onClick={() => setTab("specification")}
              className={cn(
                "relative cursor-pointer px-2 py-3 text-sm font-medium transition sm:text-base",
                tab === "specification"
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              Specification
              <span
                className={cn(
                  "absolute left-0 right-0 -bottom-[1px] h-[2px] transition",
                  tab === "specification" ? "opacity-100" : "opacity-0",
                )}
                style={{ background: PALETTE.coral }}
              />
            </button>

            <button
              type="button"
              onClick={() => setTab("description")}
              className={cn(
                "relative cursor-pointer px-2 py-3 text-sm font-medium transition sm:text-base",
                tab === "description"
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              Description
              <span
                className={cn(
                  "absolute left-0 right-0 -bottom-[1px] h-[2px] transition",
                  tab === "description" ? "opacity-100" : "opacity-0",
                )}
                style={{ background: PALETTE.coral }}
              />
            </button>
          </div>

          <div className="p-5">
            {tab === "specification" ? (
              <div className="grid gap-5 lg:grid-cols-[1fr_.9fr]">
                <div className="rounded-3xl bg-white ring-1 ring-black/5">
                  <div className="p-4">
                    <SectionTitle title="Specifications" />
                    <div className="divide-y divide-black/5">
                      {Object.entries(specs).length ? (
                        Object.entries(specs).map(([k, v]) => (
                          <SpecRow key={k} k={k} v={String(v)} />
                        ))
                      ) : (
                        <div className="py-3 text-sm text-slate-500">
                          No specifications available.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-neutral-50 p-4 ring-1 ring-black/5">
                  <SectionTitle title="Key Features" />
                  {keyFeatures.length ? (
                    <ul className="space-y-2">
                      {keyFeatures.slice(0, 8).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <FiCheckCircle
                            className="mt-0.5 h-4 w-4"
                            style={{ color: PALETTE.coral }}
                          />
                          <div className="text-sm text-slate-700 sm:text-base">
                            <span className="font-semibold text-slate-900">{item?.label}</span>:{" "}
                            {item?.value}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-slate-500">No key features available.</div>
                  )}
                </div>
              </div>
            ) : null}

            {tab === "description" ? (
              <div className="rounded-3xl bg-white p-4 ring-1 ring-black/5">
                <SectionTitle title="Description" />

                {descriptionBlocks.length ? (
                  <div className="space-y-5">
                    {descriptionBlocks.map((block, i) => (
                      <div key={i} className="rounded-2xl bg-neutral-50 p-4 ring-1 ring-black/5">
                        {block?.title ? (
                          <div className="mb-2 text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
                            {block.title}
                          </div>
                        ) : null}
                        <div className="whitespace-pre-line text-sm leading-7 font-medium text-slate-700 sm:text-base sm:leading-8">
                          {block?.details || ""}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-7 font-medium text-slate-700 sm:text-base sm:leading-8">
                    Product description is not available right now.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {relatedProducts?.length ? (
          <div className="mt-8 rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold sm:text-base" style={{ color: PALETTE.navy }}>
              Related products
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.slice(0, 8).map((it, i) => {
                const img = getImageUrl(it?.primaryImage) || "/placeholder.png";
                const name = it?.title || "Product";
                const price =
                  typeof it?.finalPrice === "number"
                    ? it.finalPrice
                    : typeof it?.price === "number"
                      ? it.price
                      : 0;

                return (
                  <button
                    key={(it?._id || it?.slug || i) + ""}
                    type="button"
                    onClick={() => handleSelectRelated(it)}
                    className="cursor-pointer overflow-hidden rounded-[1.35rem] border border-black/5 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div
                      className="h-40 w-full"
                      style={{
                        background:
                          "linear-gradient(to bottom, rgba(0,31,63,.05), rgba(255,126,105,.04), transparent)",
                      }}
                    >
                      <img src={img} alt={name} className="h-full w-full object-contain p-4" />
                    </div>

                    <div className="p-3">
                      <div className="line-clamp-2 text-sm font-semibold text-slate-900 sm:text-base">
                        {name}
                      </div>
                      <div className="mt-2 text-sm font-semibold sm:text-base" style={{ color: PALETTE.navy }}>
                        {formatBDT(price)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-8 rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                Icon: FiShield,
                title: "100% secure",
                desc: "Trusted payments and verified checkout.",
              },
              {
                Icon: FiTruck,
                title: "Fast delivery",
                desc: "Quick dispatch with careful packaging.",
              },
              {
                Icon: FiRefreshCcw,
                title: "Easy return",
                desc: "7 days return policy (conditions apply).",
              },
            ].map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-3xl bg-neutral-50 p-4 ring-1 ring-black/5"
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-black/5"
                  style={{ background: PALETTE.coralSoft }}
                >
                  <Icon className="h-5 w-5" style={{ color: PALETTE.navy }} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 sm:text-base">{title}</div>
                  <div className="mt-0.5 text-xs text-slate-500 sm:text-sm">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}