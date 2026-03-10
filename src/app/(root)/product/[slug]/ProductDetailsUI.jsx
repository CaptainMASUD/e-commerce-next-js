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
  navy: "#0f172a",
  navySoft: "#1e293b",
  coral: "#ff7e69",
  coralSoft: "rgba(255,126,105,.10)",
  gold: "#eab308",
  green: "#16a34a",
  bg: "#ffffff",
  card: "#ffffff",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  lightBorder: "#edf0f2",
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

function normalizeAttributes(attrs) {
  if (!attrs) return {};
  if (attrs instanceof Map) return Object.fromEntries(attrs.entries());
  if (typeof attrs === "object" && !Array.isArray(attrs)) return attrs;
  return {};
}

function getVariantFinalPrice(variant) {
  if (!variant) return 0;
  const sale = typeof variant.salePrice === "number" ? variant.salePrice : null;
  const base = typeof variant.price === "number" ? variant.price : 0;
  return sale !== null ? sale : base;
}

function getProductFinalPrice(product) {
  if (typeof product?.finalPrice === "number") return product.finalPrice;
  if (typeof product?.discountPrice === "number") return product.discountPrice;
  if (typeof product?.salePrice === "number") return product.salePrice;
  if (typeof product?.price === "number") return product.price;
  if (typeof product?.normalPrice === "number") return product.normalPrice;
  return 0;
}

function getProductOldPrice(product) {
  if (typeof product?.normalPrice === "number") return product.normalPrice;
  if (typeof product?.price === "number") return product.price;
  return null;
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
              color: filled ? PALETTE.gold : "#d1d5db",
              fill: filled ? PALETTE.gold : "transparent",
            }}
          />
        );
      })}
    </div>
  );
}

function FlatBadge({ children, tone = "soft" }) {
  const map = {
    soft: {
      bg: "#f8fafc",
      fg: PALETTE.navy,
      border: PALETTE.border,
    },
    coral: {
      bg: "rgba(255,126,105,.10)",
      fg: PALETTE.navy,
      border: "rgba(255,126,105,.20)",
    },
    gold: {
      bg: "rgba(234,179,8,.10)",
      fg: "#8a6700",
      border: "rgba(234,179,8,.20)",
    },
    success: {
      bg: "rgba(22,163,74,.08)",
      fg: PALETTE.green,
      border: "rgba(22,163,74,.18)",
    },
    danger: {
      bg: "rgba(239,68,68,.08)",
      fg: "#b91c1c",
      border: "rgba(239,68,68,.18)",
    },
    navy: {
      bg: "#f8fafc",
      fg: PALETTE.navy,
      border: PALETTE.border,
    },
  };

  const t = map[tone] || map.soft;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium"
      style={{
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.border}`,
      }}
    >
      {children}
    </span>
  );
}

function OptionPill({ active, disabled, children, onClick }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "cursor-pointer rounded-full px-4 py-2 text-sm transition-all",
        disabled ? "cursor-not-allowed opacity-45" : "hover:-translate-y-[1px]",
      )}
      style={{
        background: active ? PALETTE.navy : "#fff",
        color: active ? "#fff" : PALETTE.text,
        border: `1px solid ${active ? PALETTE.navy : PALETTE.border}`,
      }}
    >
      {children}
    </button>
  );
}

function Thumb({ src, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative shrink-0 cursor-pointer overflow-hidden rounded-xl bg-white transition-all"
      style={{
        border: active ? `1.5px solid ${PALETTE.coral}` : `1px solid ${PALETTE.border}`,
        boxShadow: active ? "0 0 0 3px rgba(255,126,105,.08)" : "none",
      }}
      aria-label="Select image"
      type="button"
    >
      <div className="h-16 w-16 bg-white p-2 sm:h-[72px] sm:w-[72px]">
        <img src={src} alt="" className="h-full w-full object-contain" loading="lazy" />
      </div>
    </button>
  );
}

function StockRibbon({ show }) {
  if (!show) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[1.25rem]">
      <div
        className="absolute right-[-54px] top-[22px] w-[220px] rotate-45 py-2 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-md"
        style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)" }}
      >
        Out of Stock
      </div>
    </div>
  );
}

function ProductZoomSlide({
  src,
  alt,
  active,
  zoomDesktop = 2,
  zoomMobile = 2.2,
  containerHeightClass = "h-[260px] sm:h-[320px] lg:h-[400px]",
  soldOut = false,
}) {
  const wrapRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [mobileZoomed, setMobileZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const isMobile = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  }, []);

  useEffect(() => {
    setHovered(false);
    setMobileZoomed(false);
    setPosition({ x: 50, y: 50 });
  }, [src]);

  const updatePosition = useCallback((clientX, clientY) => {
    const el = wrapRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (isMobile()) return;
      updatePosition(e.clientX, e.clientY);
    },
    [isMobile, updatePosition],
  );

  const handleTouchStart = useCallback(
    (e) => {
      if (!isMobile()) return;
      const touch = e.touches?.[0];
      if (!touch) return;

      if (!mobileZoomed) {
        setMobileZoomed(true);
      }
      updatePosition(touch.clientX, touch.clientY);
    },
    [isMobile, mobileZoomed, updatePosition],
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!isMobile() || !mobileZoomed) return;
      const touch = e.touches?.[0];
      if (!touch) return;
      updatePosition(touch.clientX, touch.clientY);
    },
    [isMobile, mobileZoomed, updatePosition],
  );

  const handleTapToggle = useCallback(
    (e) => {
      if (!isMobile()) return;
      const touch = e.changedTouches?.[0];
      if (touch) updatePosition(touch.clientX, touch.clientY);
      setMobileZoomed((prev) => !prev);
    },
    [isMobile, updatePosition],
  );

  const zoomActive = isMobile() ? mobileZoomed : hovered;
  const zoomValue = isMobile() ? zoomMobile : zoomDesktop;

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative w-full min-w-full shrink-0 overflow-hidden bg-white px-4 py-5",
        containerHeightClass,
      )}
      onMouseEnter={() => {
        if (!isMobile()) setHovered(true);
      }}
      onMouseLeave={() => {
        if (!isMobile()) {
          setHovered(false);
          setPosition({ x: 50, y: 50 });
        }
      }}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTapToggle}
      style={{ background: "#fff" }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        loading={active ? "eager" : "lazy"}
        className={cn(
          "h-full w-full object-contain transition-transform duration-200 ease-out",
          soldOut ? "grayscale-[20%] opacity-80" : "",
        )}
        style={{
          transform: zoomActive ? `scale(${zoomValue})` : "scale(1)",
          transformOrigin: `${position.x}% ${position.y}%`,
          willChange: "transform",
        }}
      />

     
    </div>
  );
}

function Gallery({ images, title, inStock }) {
  const [idx, setIdx] = useState(0);
  const thumbsWrapRef = useRef(null);
  const showThumbScrollArrows = images.length > 4;

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
    <div className="w-full min-w-0">
      <div
        className="relative overflow-hidden rounded-[1.5rem] bg-white"
        style={{
          border: `1px solid ${PALETTE.border}`,
          boxShadow: "0 8px 30px rgba(15,23,42,.04)",
        }}
      >
        <StockRibbon show={!inStock} />

        <div className="relative w-full min-w-0 max-w-full overflow-hidden">
          <div
            className="flex w-full min-w-0 max-w-full will-change-transform transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${idx * 100}%)` }}
          >
            {images.map((src, i) => (
              <ProductZoomSlide
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
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-white p-2.5 transition hover:shadow-sm sm:left-4 sm:p-3"
              style={{ border: `1px solid ${PALETTE.border}` }}
              aria-label="Previous image"
              type="button"
            >
              <FiChevronLeft className="h-5 w-5 cursor-pointer" style={{ color: PALETTE.navy }} />
            </button>

            <button
              onClick={next}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-white p-2.5 transition hover:shadow-sm sm:right-4 sm:p-3"
              style={{ border: `1px solid ${PALETTE.border}` }}
              aria-label="Next image"
              type="button"
            >
              <FiChevronRight className="h-5 w-5 cursor-pointer" style={{ color: PALETTE.navy }} />
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="relative mt-4">
          {showThumbScrollArrows ? (
            <button
              type="button"
              onClick={() => scrollThumbs("left")}
              className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 cursor-pointer rounded-full bg-white p-2 md:flex"
              style={{ border: `1px solid ${PALETTE.border}` }}
              aria-label="Scroll thumbnails left"
            >
              <FiChevronLeft className="h-4 w-4 cursor-pointer" style={{ color: PALETTE.navy }} />
            </button>
          ) : null}

          <div
            ref={thumbsWrapRef}
            className={cn(
              "hide-scrollbar flex gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none]",
              showThumbScrollArrows ? "px-0 md:px-10" : "px-0",
            )}
          >
            <style>{`.hide-scrollbar::-webkit-scrollbar{display:none;}`}</style>

            {images.map((src, i) => (
              <div key={src + i} data-thumb-i={i} className="shrink-0">
                <Thumb src={src} active={i === idx} onClick={() => setIdx(i)} />
              </div>
            ))}
          </div>

          {showThumbScrollArrows ? (
            <button
              type="button"
              onClick={() => scrollThumbs("right")}
              className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 cursor-pointer rounded-full bg-white p-2 md:flex"
              style={{ border: `1px solid ${PALETTE.border}` }}
              aria-label="Scroll thumbnails right"
            >
              <FiChevronRight className="h-4 w-4 cursor-pointer" style={{ color: PALETTE.navy }} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ProductActions() {
  return (
    <div className="flex items-center gap-2">
      <button
        className="cursor-pointer rounded-full bg-white p-2.5"
        style={{ border: `1px solid ${PALETTE.border}` }}
        aria-label="Wishlist"
        type="button"
      >
        <FiHeart className="h-5 w-5 cursor-pointer" style={{ color: PALETTE.coral }} />
      </button>
      <button
        className="cursor-pointer rounded-full bg-white p-2.5"
        style={{ border: `1px solid ${PALETTE.border}` }}
        aria-label="Share"
        type="button"
      >
        <FiShare2 className="h-5 w-5 cursor-pointer" style={{ color: PALETTE.navy }} />
      </button>
    </div>
  );
}

function SpecRow({ k, v, index }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[110px_1fr] gap-4 py-4 sm:grid-cols-[180px_1fr] sm:gap-6",
        index !== 0 && "border-t",
      )}
      style={{
        borderColor: index !== 0 ? PALETTE.lightBorder : "transparent",
      }}
    >
      <div className="text-sm font-medium text-slate-500 sm:text-[15px]">{k}</div>
      <div className="text-sm font-normal leading-7 text-slate-900 sm:text-[15px]">{v}</div>
    </div>
  );
}

function normalizeFeatures(features) {
  return [...features].sort((a, b) => {
    const ao = Number(a?.order || 0);
    const bo = Number(b?.order || 0);
    return ao - bo;
  });
}

function buildVariantGroupsFromVariants(variants) {
  const groupMap = {};

  variants.forEach((variant) => {
    const attrs = normalizeAttributes(variant?.attributes);
    Object.entries(attrs).forEach(([key, value]) => {
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
      const attrs = normalizeAttributes(variant?.attributes);
      return Object.entries(selectedAttributes).every(
        ([key, value]) => String(attrs?.[key] || "") === String(value || ""),
      );
    }) || null
  );
}

function RelatedProductsSlider({ items = [], onSelect }) {
  const wrapRef = useRef(null);

  const scrollByAmount = useCallback((dir) => {
    const el = wrapRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.9, 280);
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  if (!items.length) return null;

  return (
    <section className="mt-14">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">Related products</h3>
          <p className="mt-1 text-sm text-slate-500">Similar products you may also like</p>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollByAmount("left")}
            className="cursor-pointer rounded-full bg-white p-2"
            style={{ border: `1px solid ${PALETTE.border}` }}
            aria-label="Previous related products"
          >
            <FiChevronLeft className="h-4 w-4 cursor-pointer" style={{ color: PALETTE.navy }} />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount("right")}
            className="cursor-pointer rounded-full bg-white p-2"
            style={{ border: `1px solid ${PALETTE.border}` }}
            aria-label="Next related products"
          >
            <FiChevronRight className="h-4 w-4 cursor-pointer" style={{ color: PALETTE.navy }} />
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="hide-scrollbar flex gap-4 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [-ms-overflow-style:none]"
      >
        <style>{`.hide-scrollbar::-webkit-scrollbar{display:none;}`}</style>

        {items.map((it, i) => {
          const img = getImageUrl(it?.primaryImage) || getImageUrl(it?.image) || "/placeholder.png";
          const relatedTitle = it?.title || it?.name || "Product";
          const finalPrice = getProductFinalPrice(it);
          const oldPrice = getProductOldPrice(it);
          const discount = getDiscountPercent(oldPrice, finalPrice);
          const inStock = typeof it?.inStockNow === "boolean" ? it.inStockNow : true;

          return (
            <button
              key={(it?._id || it?.slug || i) + ""}
              type="button"
              onClick={() => onSelect?.(it)}
              className="w-[240px] shrink-0 cursor-pointer overflow-hidden rounded-[1.25rem] bg-white text-left transition hover:-translate-y-0.5"
              style={{
                border: `1px solid ${PALETTE.border}`,
                boxShadow: "0 6px 18px rgba(15,23,42,.04)",
              }}
            >
              <div className="relative h-44 w-full bg-white">
                {!inStock ? (
                  <div className="absolute left-3 top-3 z-10 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-medium text-red-600 ring-1 ring-red-100">
                    Out of stock
                  </div>
                ) : null}
                <img src={img} alt={relatedTitle} className="h-full w-full object-contain p-4" />
              </div>

              <div className="p-4">
                <div className="line-clamp-2 min-h-[44px] text-sm font-medium text-slate-900 sm:text-base">
                  {relatedTitle}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold sm:text-base" style={{ color: PALETTE.navy }}>
                    {formatBDT(finalPrice)}
                  </div>

                  {oldPrice && oldPrice > finalPrice ? (
                    <div className="text-xs text-slate-400 line-through sm:text-sm">
                      {formatBDT(oldPrice)}
                    </div>
                  ) : null}

                  {discount ? (
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-medium sm:text-[11px]"
                      style={{
                        background: "rgba(255,126,105,.14)",
                        color: PALETTE.navy,
                      }}
                    >
                      {discount}% OFF
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FeatureCards() {
  const items = [
    {
      Icon: FiShield,
      title: "100% secure",
      desc: "",
    },
    {
      Icon: FiTruck,
      title: "Fast delivery",
      desc: "",
    },
    {
      Icon: FiRefreshCcw,
      title: "Easy return",
      desc: "7 days",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 pt-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ Icon, title, desc }) => (
        <div
          key={title}
          className="flex min-w-0 items-center gap-3 rounded-2xl bg-white px-4 py-4"
          style={{ border: `1px solid ${PALETTE.border}` }}
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: PALETTE.coralSoft,
              border: `1px solid ${PALETTE.border}`,
            }}
          >
            <Icon className="h-5 w-5" style={{ color: PALETTE.navy }} />
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-slate-900 sm:text-base">{title}</div>
            {desc ? <div className="mt-0.5 text-sm text-slate-500">{desc}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
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
  const brandLabel = p?.brand?.name || "";
  const basePrimary = getImageUrl(p?.primaryImage) || "/placeholder.png";

  const variants = useMemo(
    () => (Array.isArray(p?.variants) ? p.variants.filter((v) => v?.isActive !== false) : []),
    [p?.variants],
  );

  const variantState = p?.variantState || null;

  const variantGroups = useMemo(() => {
    if (variantState?.attributeKeys?.length) {
      return variantState.attributeKeys.map((key) => ({
        name: key,
        options: Array.isArray(variantState?.allOptions?.[key]) ? variantState.allOptions[key] : [],
        availableOptions: Array.isArray(variantState?.availableOptions?.[key])
          ? variantState.availableOptions[key]
          : [],
      }));
    }

    return buildVariantGroupsFromVariants(variants).map((g) => ({
      ...g,
      availableOptions: g.options,
    }));
  }, [variantState, variants]);

  const [selectedAttributes, setSelectedAttributes] = useState({});

  useEffect(() => {
    if (!variantGroups.length) {
      setSelectedAttributes({});
      return;
    }

    const initial = {};

    variantGroups.forEach((group) => {
      const fromApi = variantState?.selection?.[group.name];
      if (fromApi && group.options.includes(fromApi)) {
        initial[group.name] = fromApi;
        return;
      }

      const firstAvailable =
        group.availableOptions?.find((opt) => group.options.includes(opt)) || group.options[0];

      if (firstAvailable) initial[group.name] = firstAvailable;
    });

    setSelectedAttributes(initial);
  }, [variantGroups, variantState]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;

    if (p?.selectedVariant?.barcode) {
      const found = variants.find((v) => String(v?.barcode || "") === String(p.selectedVariant.barcode));
      if (
        found &&
        Object.keys(selectedAttributes).every(
          (k) => normalizeAttributes(found.attributes)?.[k] === selectedAttributes[k],
        )
      ) {
        return found;
      }
    }

    if (!variantGroups.length) return variants[0] || null;
    return findMatchingVariant(variants, selectedAttributes) || variants[0] || null;
  }, [variants, variantGroups, selectedAttributes, p?.selectedVariant]);

  const galleryImages = useMemo(() => {
    const urls = [];
    const add = (u) => {
      const s = String(u || "").trim();
      if (!s) return;
      if (!urls.includes(s)) urls.push(s);
    };

    if (selectedVariant?.images?.length) {
      selectedVariant.images.forEach((img) => add(getImageUrl(img)));
      add(basePrimary);
      (Array.isArray(p?.galleryImages) ? p.galleryImages : []).forEach((img) =>
        add(getImageUrl(img)),
      );
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
      typeof p?.price === "number"
        ? p.price
        : typeof p?.normalPrice === "number"
          ? p.normalPrice
          : null;

    return {
      oldPrice: oldPrice > finalPrice ? oldPrice : null,
      finalPrice,
    };
  }, [selectedVariant, p]);

  const stockQty = selectedVariant ? toNum(selectedVariant?.stockQty) : toNum(p?.availableStock);
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
    if (p?.productType) all.Type = p.productType;
    if (selectedVariant?.barcode) all.Barcode = selectedVariant.barcode;
    else if (p?.barcode) all.Barcode = p.barcode;

    features.forEach((item, index) => {
      const label = String(item?.label || `Spec ${index + 1}`).trim();
      const value = String(item?.value || "").trim();
      if (!label || !value) return;
      all[label] = value;
    });

    return all;
  }, [brandLabel, p?.productType, p?.barcode, selectedVariant, features]);

  const descriptionBlocks = useMemo(() => {
    return Array.isArray(p?.description)
      ? [...p.description].sort((a, b) => (a?.order || 0) - (b?.order || 0))
      : [];
  }, [p?.description]);

  const filteredRelatedProducts = useMemo(() => {
    const currentId = String(p?._id || "");
    const currentSlug = String(p?.slug || "");

    return (Array.isArray(relatedProducts) ? relatedProducts : []).filter((item) => {
      const sameId = currentId && String(item?._id || "") === currentId;
      const sameSlug = currentSlug && String(item?.slug || "") === currentSlug;
      return !sameId && !sameSlug;
    });
  }, [relatedProducts, p?._id, p?.slug]);

  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("specification");

  useEffect(() => {
    setQty(1);
  }, [p?._id, p?.slug, selectedVariant?.barcode]);

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
      className="min-h-screen overflow-x-hidden font-sans"
      style={{ background: PALETTE.bg, color: PALETTE.text }}
    >
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {typeof onBack === "function" ? (
          <button
            type="button"
            onClick={onBack}
            className="mb-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:shadow-sm"
            style={{ border: `1px solid ${PALETTE.border}` }}
          >
            <FiChevronLeft className="h-4 w-4 cursor-pointer" />
            Back
          </button>
        ) : null}

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="min-w-0">
            <Gallery images={galleryImages} title={title} inStock={inStock} />
          </div>

          <div
            className="min-w-0 rounded-[1.5rem] bg-white p-5 sm:p-6"
            style={{
              border: `1px solid ${PALETTE.border}`,
              boxShadow: "0 8px 30px rgba(15,23,42,.04)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {isTrending ? <FlatBadge tone="coral">Trending</FlatBadge> : null}
                {isNew ? <FlatBadge tone="gold">New arrival</FlatBadge> : null}
                {p?.tags?.[0] ? (
                  <FlatBadge tone="navy">
                    <FiTag style={{ color: PALETTE.gold }} />
                    {p.tags[0]}
                  </FlatBadge>
                ) : null}
                {inStock ? (
                  <FlatBadge tone="success">In stock • {stockQty} left</FlatBadge>
                ) : (
                  <FlatBadge tone="danger">Out of stock</FlatBadge>
                )}
              </div>

              <ProductActions />
            </div>

            <div className="mt-5 border-b pb-5" style={{ borderColor: PALETTE.lightBorder }}>
              {brandLabel ? (
                <div className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  {brandLabel}
                </div>
              ) : null}

              <h1 className="text-2xl font-semibold leading-snug tracking-tight text-slate-900 sm:text-3xl lg:text-[2rem]">
                {title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Stars value={rating} />
                  <span className="text-sm font-medium text-slate-900">
                    {Number(rating).toFixed(1)}
                  </span>
                  <span className="text-sm text-slate-500">({reviewCount} reviews)</span>
                </div>
              </div>

              {keyFeatures.length ? (
                <div className="mt-5 grid gap-3">
                  {keyFeatures.slice(0, 5).map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full"
                        style={{ background: PALETTE.coralSoft }}
                      >
                        <FiCheckCircle className="h-4 w-4" style={{ color: PALETTE.navy }} />
                      </span>
                      <div className="text-sm font-normal text-slate-700 sm:text-[15px]">
                        <span className="font-medium text-slate-900">{f?.label}</span>: {f?.value}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="border-b py-5" style={{ borderColor: PALETTE.lightBorder }}>
              <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
                <div className="text-3xl font-semibold sm:text-[2rem]" style={{ color: PALETTE.navy }}>
                  {formatBDT(displayPrice.finalPrice)}
                </div>

                {displayPrice.oldPrice ? (
                  <div className="pb-1 text-base font-normal text-slate-400 line-through">
                    {formatBDT(displayPrice.oldPrice)}
                  </div>
                ) : null}

                {discountPercent ? (
                  <span
                    className="mb-1 rounded-full px-3 py-1 text-xs font-medium sm:text-sm"
                    style={{
                      background: "rgba(255,126,105,.14)",
                      color: PALETTE.navy,
                    }}
                  >
                    {discountPercent}% OFF
                  </span>
                ) : null}
              </div>

              <div className="mt-2 text-sm text-slate-500">
                Tax included. Shipping calculated at checkout.
              </div>
            </div>

            {variantGroups.length ? (
              <div className="border-b py-5" style={{ borderColor: PALETTE.lightBorder }}>
                <div className="space-y-5">
                  {variantGroups.map((group) => (
                    <div key={group.name}>
                      <div className="mb-3 text-sm font-medium capitalize text-slate-800">
                        {group.name}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {group.options.map((opt) => {
                          const active = selectedAttributes[group.name] === opt;
                          const available = group.availableOptions?.includes(opt);

                          return (
                            <OptionPill
                              key={opt}
                              active={active}
                              disabled={!available}
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
                  <div className="mt-5 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">Selected:</span>{" "}
                    {Object.entries(normalizeAttributes(selectedVariant?.attributes))
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" • ")}
                    {selectedVariant?.barcode ? (
                      <>
                        {" "}
                        <span className="text-slate-400">|</span>{" "}
                        <span>
                          Barcode:{" "}
                          <span className="font-medium text-slate-700">{selectedVariant.barcode}</span>
                        </span>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="border-b py-5" style={{ borderColor: PALETTE.lightBorder }}>
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <div className="text-sm font-medium text-slate-900">Quantity</div>

                  <div
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-white p-2"
                    style={{ border: `1px solid ${PALETTE.border}` }}
                  >
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="cursor-pointer rounded-full bg-white p-2 transition hover:bg-slate-50"
                      style={{ border: `1px solid ${PALETTE.border}` }}
                      aria-label="Decrease"
                      type="button"
                    >
                      <FiMinus className="cursor-pointer" />
                    </button>

                    <div className="min-w-[48px] text-center text-sm font-medium text-slate-900 sm:text-base">
                      {qty}
                    </div>

                    <button
                      onClick={() => setQty((q) => q + 1)}
                      className="cursor-pointer rounded-full bg-white p-2 transition hover:bg-slate-50"
                      style={{ border: `1px solid ${PALETTE.border}` }}
                      aria-label="Increase"
                      type="button"
                    >
                      <FiPlus className="cursor-pointer" />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Total</div>
                  <div className="mt-2 text-2xl font-semibold" style={{ color: PALETTE.green }}>
                    {formatBDT(displayPrice.finalPrice * qty)}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  className="cursor-pointer rounded-full px-5 py-3.5 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                  style={{ backgroundColor: PALETTE.navy }}
                  type="button"
                  disabled={!inStock}
                >
                  Add To Cart
                </button>

                <button
                  className="cursor-pointer rounded-full px-5 py-3.5 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                  style={{ background: `linear-gradient(135deg, ${PALETTE.coral}, #f96d57)` }}
                  type="button"
                  disabled={!inStock}
                >
                  Buy Now
                </button>
              </div>
            </div>

            <FeatureCards />
          </div>
        </section>

        <section
          className="mt-14 rounded-[1.5rem] bg-white p-5 sm:p-6"
          style={{
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 8px 30px rgba(15,23,42,.04)",
          }}
        >
          <div
            className="flex flex-wrap items-center gap-3 border-b pb-4"
            style={{ borderColor: PALETTE.lightBorder }}
          >
            <button
              type="button"
              onClick={() => setTab("specification")}
              className="cursor-pointer rounded-full px-4 py-2.5 text-sm font-medium transition hover:shadow-sm sm:text-[15px]"
              style={{
                background: tab === "specification" ? PALETTE.navy : "#fff",
                color: tab === "specification" ? "#fff" : PALETTE.text,
                border: `1px solid ${tab === "specification" ? PALETTE.navy : PALETTE.border}`,
              }}
            >
              Specification
            </button>

            <button
              type="button"
              onClick={() => setTab("description")}
              className="cursor-pointer rounded-full px-4 py-2.5 text-sm font-medium transition hover:shadow-sm sm:text-[15px]"
              style={{
                background: tab === "description" ? PALETTE.coral : "#fff",
                color: tab === "description" ? "#fff" : PALETTE.text,
                border: `1px solid ${tab === "description" ? PALETTE.coral : PALETTE.border}`,
              }}
            >
              Description
            </button>
          </div>

          <div className="pt-8">
            {tab === "specification" ? (
              <div className="grid gap-10 lg:grid-cols-[1fr_.95fr]">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Technical specifications</h2>

                  <div className="mt-5">
                    {Object.entries(specs).length ? (
                      Object.entries(specs).map(([k, v], i) => (
                        <SpecRow key={k} k={k} v={String(v)} index={i} />
                      ))
                    ) : (
                      <div className="text-sm text-slate-500 sm:text-base">
                        No specifications available.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Key highlights</h2>

                  {keyFeatures.length ? (
                    <div className="mt-5 space-y-4">
                      {keyFeatures.slice(0, 8).map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 border-b pb-4"
                          style={{ borderColor: PALETTE.lightBorder }}
                        >
                          <div
                            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                            style={{ background: PALETTE.coralSoft }}
                          >
                            <FiCheckCircle className="h-4 w-4" style={{ color: PALETTE.coral }} />
                          </div>

                          <div className="text-sm leading-7 text-slate-700 sm:text-[15px]">
                            <span className="font-medium text-slate-900">{item?.label}</span>:{" "}
                            {item?.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 text-sm text-slate-500 sm:text-base">
                      No key features available.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {tab === "description" ? (
              <div className="max-w-4xl">
                {descriptionBlocks.length ? (
                  <div className="space-y-8">
                    {descriptionBlocks.map((block, i) => (
                      <div
                        key={i}
                        className="border-b pb-8"
                        style={{ borderColor: PALETTE.lightBorder }}
                      >
                        {block?.title ? (
                          <h3 className="text-2xl font-semibold leading-snug text-slate-900">
                            {block.title}
                          </h3>
                        ) : null}

                        <div className="mt-4 whitespace-pre-line text-sm leading-8 font-normal text-slate-700 sm:text-base">
                          {block?.details || ""}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm font-normal text-slate-600 sm:text-base">
                    Product description is not available right now.
                  </div>
                )}
              </div>
            ) : null}

            <RelatedProductsSlider items={filteredRelatedProducts} onSelect={handleSelectRelated} />
          </div>
        </section>
      </main>
    </div>
  );
}