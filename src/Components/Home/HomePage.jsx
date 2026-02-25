"use client";

// HomePage.jsx (Next.js App Router - FULL UPDATED)
// ✅ Removed Footer (not included)
// ✅ New Arrivals: grid (iPad first, then phones + watches)
// ✅ Remove ALL top-left product tags -> ONLY %OFF badge (FiTag) stays
// ✅ Products: show ONLY 2 rows first, then "See more" adds 2 rows per click
// ✅ Trending slider: phones + AirPods
// ✅ Colored price
// ✅ Converted: react-router-dom -> next/navigation

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import HomeSlider from "./HomeSlider";
import FeatureStrips from "./FeatureStrips";
import HomeCategory from "./HomeCategory";

import { FiChevronLeft, FiChevronRight, FiFilter, FiTag, FiSliders, FiShoppingCart } from "react-icons/fi";

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  cta: "#ff6b6b",
  gold: "#eab308",
  bg: "#fafafa",
  price: "#ff6b6b",
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatBDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n);

const pctOff = (price, oldPrice) => {
  if (!oldPrice || oldPrice <= price) return 0;
  const pct = Math.round(((oldPrice - price) / oldPrice) * 100);
  return Math.max(1, Math.min(90, pct));
};

/**
 * ✅ Layout rules
 * - mobile: 2 cards/row
 * - md: 3 cards/row
 * - lg+: 5 cards/row
 */
const GRID = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3";
const CARD_WIDTH_STYLE = { width: "clamp(170px, 19vw, 240px)" };

/* -------------------- DATA -------------------- */

const IMG = {
  iphone17:
    "https://www.applegadgetsbd.com/_next/image?url=https%3A%2F%2Fadminapi.applegadgetsbd.com%2Fstorage%2Fmedia%2Flarge%2FiPhone-17-Pro-Max-cosmic-orange-8534.jpg&w=3840&q=100",
  s25ultra:
    "https://smartteleworld.com.bd/wp-content/uploads/2025/03/samsung-galaxy-s25-ultra-titanium-silver632.jpeg",
  ipad:
    "https://maccity.com.bd/wp-content/uploads/2024/06/iPad-Air-13-inch-M2-Purple-MacCity-BD--1200x900.webp",
  xiaomiNote17ProMax:
    "https://i02.appmifile.com/304_operatorx_operatorx_uploadTiptapImage/25/09/2025/21ef35eac7a6b396c906c833ee109cbf.jpg",
  xiaomiNote17:
    "https://i02.appmifile.com/981_operatorx_operatorx_uploadTiptapImage/25/09/2025/1741045a8605c0bbd06012b45131cbab.jpg",
  iqoo15:
    "https://exstatic-in.iqoo.com/Oz84QB3Wo0uns8j1/in/1763378896554/a2988f0a64104e78de106346f6f456f6.png_w860-h860.webp",
  vivoX200t: "https://adminapi.applegadgetsbd.com/storage/media/large/vivo-X200-5G-White-8969.jpg",

  smartWatch1: "https://static-01.daraz.com.bd/p/5b4a59cfd23f021ad43270df4af5fdab.jpg",
  ticwatchE3:
    "https://motionview.com.bd/_next/image?url=https%3A%2F%2Fmotionview.s3.amazonaws.com%2Fimages%2Fproducts%2Fprofile%2F165051690172.ticwatch%20e3%20smart%20watch.webp&w=3840&q=75",
  kidsSmartWatch: "https://m.media-amazon.com/images/I/71T34y1QmiL._AC_SL1000__.jpg",
  oraimoWatch5: "https://media.gadgetandgear.com/upload/media/oraimo-watch-5-osw-805-pink.jpeg",

  aweiAt7: "https://gearybd.com/wp-content/uploads/2024/09/images.jpeg",
  moxomWl75: "https://my-live-01.slatic.net/p/ba83453d779bca98a7a1aa0ec4c5eb3c.jpg",
  airpodsPro: "https://img.drz.lazcdn.com/static/bd/p/e5b23c70b92d51ac06d54b59f4ebddf5.jpg_720x720q80.jpg",
};

export const productsSeed = [
  // iPad first (for New Arrivals)
  {
    id: "p1",
    title: "iPad Air 13-inch (M2) - Purple",
    category: "Tablets",
    brand: "Apple",
    priceBDT: 149990,
    oldPriceBDT: 159990,
    image: IMG.ipad,
    badges: { new: true },
  },

  // Phones
  {
    id: "p2",
    title: "iPhone 17 Pro Max (Cosmic Orange)",
    category: "Phones",
    brand: "Apple",
    priceBDT: 289990,
    oldPriceBDT: 309990,
    image: IMG.iphone17,
    badges: { new: true, trending: true },
  },
  {
    id: "p3",
    title: "Samsung Galaxy S25 Ultra (Titanium Silver)",
    category: "Phones",
    brand: "Samsung",
    priceBDT: 239990,
    oldPriceBDT: 259990,
    image: IMG.s25ultra,
    badges: { new: true, trending: true },
  },
  {
    id: "p4",
    title: "Xiaomi Note 17 Pro Max",
    category: "Phones",
    brand: "Xiaomi",
    priceBDT: 57990,
    oldPriceBDT: 62990,
    image: IMG.xiaomiNote17ProMax,
    badges: { new: true, trending: true },
  },
  {
    id: "p5",
    title: "Xiaomi Note 17",
    category: "Phones",
    brand: "Xiaomi",
    priceBDT: 37990,
    oldPriceBDT: 41990,
    image: IMG.xiaomiNote17,
    badges: { new: true, trending: true },
  },
  {
    id: "p6",
    title: "iQOO 15",
    category: "Phones",
    brand: "iQOO",
    priceBDT: 69990,
    oldPriceBDT: 75990,
    image: IMG.iqoo15,
    badges: { new: true, trending: true },
  },
  {
    id: "p7",
    title: "vivo X200t (White)",
    category: "Phones",
    brand: "vivo",
    priceBDT: 64990,
    oldPriceBDT: 69990,
    image: IMG.vivoX200t,
    badges: { new: true, trending: true },
  },

  // Watches (New Arrivals)
  {
    id: "p8",
    title: "TicWatch E3 Android Wear OS Smart Watch",
    category: "Smart Watches",
    brand: "Mobvoi",
    priceBDT: 18990,
    oldPriceBDT: 21990,
    image: IMG.ticwatchE3,
    badges: { new: true },
  },
  {
    id: "p9",
    title: "Oraimo Watch 5 Calling Smart Watch",
    category: "Smart Watches",
    brand: "Oraimo",
    priceBDT: 6990,
    oldPriceBDT: 7990,
    image: IMG.oraimoWatch5,
    badges: { new: true },
  },
  {
    id: "p10",
    title: "Kids Smart Watch (Girls/Boys)",
    category: "Smart Watches",
    brand: "Kids",
    priceBDT: 3990,
    oldPriceBDT: 4990,
    image: IMG.kidsSmartWatch,
    badges: { new: true },
  },
  {
    id: "p11",
    title: "Smart Watch (Bluetooth Calling)",
    category: "Smart Watches",
    brand: "Generic",
    priceBDT: 2990,
    oldPriceBDT: 3990,
    image: IMG.smartWatch1,
    badges: { new: true },
  },

  // Audio (Trending includes AirPods)
  {
    id: "p12",
    title: "AirPods Pro",
    category: "Audio",
    brand: "Apple",
    priceBDT: 27990,
    oldPriceBDT: 31990,
    image: IMG.airpodsPro,
    badges: { new: true, trending: true },
  },
  {
    id: "p13",
    title: "Awei AT7 Bluetooth Headphones",
    category: "Audio",
    brand: "Awei",
    priceBDT: 1790,
    oldPriceBDT: 2490,
    image: IMG.aweiAt7,
    badges: { new: false },
  },
  {
    id: "p14",
    title: "MOXOM MX-WL75 Air Light Bluetooth V5.3 (45H)",
    category: "Audio",
    brand: "MOXOM",
    priceBDT: 2590,
    oldPriceBDT: 3490,
    image: IMG.moxomWl75,
    badges: { new: true },
  },
];

export function getAllProducts() {
  const cats = ["Phones", "Tablets", "Smart Watches", "Audio"];
  const brands = ["Apple", "Samsung", "Xiaomi", "iQOO", "vivo", "Mobvoi", "Oraimo", "Awei", "MOXOM", "Generic"];

  const base = productsSeed.map((p, i) => ({
    ...p,
    brand: p.brand || brands[i % brands.length],
    inStock: p.inStock ?? true,
    oldPriceBDT: p.oldPriceBDT ?? (i % 2 === 0 ? (p.priceBDT || 0) + 1200 : undefined),
    badges: p.badges ?? { new: false },
  }));

  // create more items to fill product grid
  const target = Math.max(34, base.length);
  const out = [...base];
  let nextIdNum = base.length + 1;

  while (out.length < target) {
    const src = base[out.length % base.length];
    const bump = (out.length % 3) * 500;

    const newPrice = (src.priceBDT || 0) + bump;
    const oldPrice = newPrice + (nextIdNum % 2 === 0 ? 1200 : 800);

    out.push({
      ...src,
      id: `p${nextIdNum}`,
      title: `${src.title} (Edition ${nextIdNum})`,
      priceBDT: newPrice,
      oldPriceBDT: oldPrice,
      brand: brands[nextIdNum % brands.length],
      category: cats[nextIdNum % cats.length],
      inStock: nextIdNum % 7 !== 0,
      badges: { ...src.badges, new: nextIdNum % 5 === 0 },
    });

    nextIdNum += 1;
  }

  return out;
}

/* -------------------- HEADERS -------------------- */

function CurvedUnderline({ color = PALETTE.coral, center = false }) {
  return (
    <div className={cn("mt-2", center ? "flex justify-center" : "")}>
      <svg width="210" height="18" viewBox="0 0 210 18" fill="none" aria-hidden="true">
        <path
          d="M8 12 C58 2, 152 2, 202 12"
          stroke="rgba(0,31,63,0.10)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path d="M10 12 C60 3, 150 3, 200 12" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path
          d="M40 12 C75 6, 110 6, 145 12"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function SectionHeader({ title, accent = "coral", rightSlot }) {
  const accentColor = accent === "gold" ? PALETTE.gold : PALETTE.coral;

  return (
    <div className="relative">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-2xl font-black tracking-tight sm:text-[30px]" style={{ color: PALETTE.navy }}>
            {title}
          </div>
          <CurvedUnderline color={accentColor} />
        </div>
        {rightSlot ? <div className="flex">{rightSlot}</div> : null}
      </div>
    </div>
  );
}

/* -------------------- PRODUCT CARD -------------------- */
/* ✅ ONLY %OFF badge on image */

const ProductCard = React.memo(function ProductCard({ p, onAdd, onOpen }) {
  const hasDiscount = typeof p.oldPriceBDT === "number" && p.oldPriceBDT > p.priceBDT;
  const discount = hasDiscount ? pctOff(p.priceBDT, p.oldPriceBDT) : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(p)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? onOpen?.(p) : null)}
      className={cn(
        "group cursor-pointer overflow-hidden rounded-3xl border border-black/5 bg-white transition",
        "hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none",
        "h-full flex flex-col"
      )}
      style={{ boxShadow: "0 10px 28px rgba(0,31,63,.07), 0 1px 0 rgba(0,0,0,.02)" }}
    >
      <div className="relative overflow-hidden">
        <div className="h-36 sm:h-40 md:h-44">
          {/* NOTE: external images require next.config.js images.remotePatterns or use <img /> */}
          <img
            src={p.image}
            alt={p.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover scale-[1.06] transition-transform duration-500 ease-out will-change-transform group-hover:scale-100 motion-reduce:transition-none"
          />
        </div>

        {hasDiscount ? (
          <div className="absolute right-2 top-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black text-white shadow-sm ring-1 ring-black/10"
              style={{ backgroundColor: PALETTE.cta }}
              aria-label={`${discount}% off`}
            >
              <FiTag className="h-3.5 w-3.5" />
              {discount}% OFF
            </span>
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <div className="text-[10px] font-extrabold" style={{ color: PALETTE.coral }}>
          {p.category}
        </div>

        <div className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug tracking-tight text-slate-900">
          {p.title}
        </div>

        <div className="mt-auto pt-3 flex items-end justify-between gap-1.5 sm:gap-2">
          <div className="flex min-w-0 flex-col">
            <div className="text-[13px] font-black" style={{ color: PALETTE.price }}>
              {formatBDT(p.priceBDT)}
            </div>
            {hasDiscount ? (
              <div className="text-[11px] font-semibold text-slate-500 line-through">{formatBDT(p.oldPriceBDT)}</div>
            ) : (
              <div className="h-[16px]" />
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd?.(p);
            }}
            className={cn(
              "cursor-pointer shrink-0 whitespace-nowrap inline-flex items-center",
              "gap-1 rounded-2xl font-black text-white shadow-sm active:scale-[0.99]",
              "px-2.5 py-1.5 text-[10px]",
              "sm:gap-1.5 sm:px-3 sm:py-2 sm:text-[11px]"
            )}
            style={{ backgroundColor: PALETTE.cta }}
          >
            <FiShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
});

/* -------------------- TRENDING SLIDER -------------------- */

function ProductSlider({ title, accent, items, onAdd, onOpen }) {
  const wrapRef = useRef(null);

  const scrollByCard = useCallback((dir) => {
    const el = wrapRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card='1']");
    const amount = card ? Math.round(card.getBoundingClientRect().width * 1.15) : 260;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }, []);

  const rightSlot = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => scrollByCard(-1)}
        className="cursor-pointer rounded-full bg-white p-2.5 ring-1 ring-black/10 hover:bg-slate-50 active:scale-[0.98]"
        aria-label={`Scroll ${title} left`}
        type="button"
      >
        <FiChevronLeft className="h-4 w-4" style={{ color: PALETTE.navy }} />
      </button>

      <button
        onClick={() => scrollByCard(1)}
        className="cursor-pointer rounded-full bg-white p-2.5 ring-1 ring-black/10 hover:bg-slate-50 active:scale-[0.98]"
        aria-label={`Scroll ${title} right`}
        type="button"
      >
        <FiChevronRight className="h-4 w-4" style={{ color: PALETTE.navy }} />
      </button>
    </div>
  );

  return (
    <section className="mt-10">
      <SectionHeader title={title} accent={accent} rightSlot={rightSlot} />
      <div className="mt-4">
        <div
          ref={wrapRef}
          className={cn(
            "hide-scrollbar flex gap-2 sm:gap-3 overflow-x-auto",
            "snap-x snap-mandatory",
            "[-webkit-overflow-scrolling:touch]",
            "[scrollbar-width:none]",
            "[-ms-overflow-style:none]"
          )}
        >
          <style>{`.hide-scrollbar::-webkit-scrollbar{display:none;}`}</style>

          {items.map((p, idx) => (
            <div
              key={p.id}
              className="snap-start shrink-0"
              style={CARD_WIDTH_STYLE}
              data-card={idx === 0 ? "1" : undefined}
            >
              <ProductCard p={p} onAdd={onAdd} onOpen={onOpen} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- HOME PAGE -------------------- */

export default function HomePage({ query = "", setQuery }) {
  const router = useRouter();
  const productsSectionRef = useRef(null);

  const [minPrice] = useState(0);
  const [maxPrice] = useState(400000);

  // ✅ "Products" show-more state (2 rows at a time)
  const [rowsToShow, setRowsToShow] = useState(2);

  const onAdd = useCallback(() => {}, []);

  const allProducts = useMemo(() => getAllProducts(), []);

  // ✅ Trending: phones + airpods
  const trending = useMemo(() => {
    const list = allProducts.filter(
      (p) =>
        p.category === "Phones" ||
        p.title.toLowerCase().includes("airpods") ||
        p.badges?.trending
    );
    return list.slice(0, 12);
  }, [allProducts]);

  // ✅ New Arrivals: iPad first, then phones, then watches (only NEW)
  const newArrivals = useMemo(() => {
    const list = allProducts.filter((p) => p.badges?.new);

    const score = (p) => {
      const t = (p.title || "").toLowerCase();
      if (t.includes("ipad")) return 0; // first
      if (p.category === "Phones") return 1;
      if (p.category === "Smart Watches") return 2;
      return 3;
    };

    return [...list].sort((a, b) => score(a) - score(b)).slice(0, 10);
  }, [allProducts]);

  // ✅ Products (search filter only), then show 2 rows at a time
  const filteredProducts = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    let list = allProducts;

    if (q) list = list.filter((p) => `${p.title} ${p.category} ${p.brand || ""}`.toLowerCase().includes(q));
    list = list.filter((p) => p.priceBDT >= minPrice && p.priceBDT <= maxPrice);

    return list;
  }, [query, allProducts, minPrice, maxPrice]);

  // lg shows 5/row => 2 rows = 10
  const CARDS_PER_BATCH = 10;
  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, rowsToShow * CARDS_PER_BATCH),
    [filteredProducts, rowsToShow]
  );

  const hasMoreProducts = visibleProducts.length < filteredProducts.length;

  const openProduct = useCallback(
    (p) => {
      // ✅ update this route to match your Next app:
      // if you use /app/product/[id]/page.jsx => use `/product/${p.id}`
      router.push(`/product/${p.id}`);
    },
    [router]
  );

  const scrollToProducts = useCallback(() => {
    productsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const newArrivalsRightSlot = (
    <button
      onClick={scrollToProducts}
      className="cursor-pointer rounded-full bg-white px-3 py-2 text-xs font-black ring-1 ring-black/10 hover:bg-slate-50 active:scale-[0.98]"
      style={{ color: PALETTE.navy }}
      type="button"
    >
      See all
    </button>
  );

  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,31,63,.12), rgba(255,126,105,.10), rgba(234,179,8,.06), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <HomeSlider />
        <FeatureStrips />
        <HomeCategory onSelect={(label) => setQuery?.(label)} />

        {/* ✅ Trending slider */}
        <ProductSlider title="Trending Now" accent="coral" items={trending} onAdd={onAdd} onOpen={openProduct} />

        {/* ✅ New Arrivals grid (iPad first) */}
        <section className="mt-10">
          <SectionHeader title="New Arrivals" accent="gold" rightSlot={newArrivalsRightSlot} />
          <div className={cn("mt-4", GRID)}>
            {newArrivals.map((p) => (
              <ProductCard key={p.id} p={p} onAdd={onAdd} onOpen={openProduct} />
            ))}
          </div>
        </section>

        {/* ✅ Products: show 2 rows, then See more => +2 rows */}
        <section className="mt-10" ref={productsSectionRef}>
          <div className="flex items-end justify-between gap-3">
            <div className="flex-1">
              <SectionHeader title="Products" accent="coral" />
            </div>

            <button
              type="button"
              className="relative inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-black text-slate-900 shadow-sm hover:bg-slate-50 active:scale-[0.99]"
              onClick={scrollToProducts}
            >
              <FiFilter className="h-4 w-4" style={{ color: PALETTE.navy }} />
              Browse
            </button>
          </div>

          <div className={cn("mt-4", GRID)}>
            {visibleProducts.map((p) => (
              <ProductCard key={p.id} p={p} onAdd={onAdd} onOpen={openProduct} />
            ))}
          </div>

          {hasMoreProducts ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setRowsToShow((r) => r + 2)}
                className="cursor-pointer inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-black text-white shadow-md active:scale-[0.99]"
                style={{ backgroundColor: PALETTE.navy }}
              >
                See more
              </button>
            </div>
          ) : null}
        </section>
      </main>

      {/* Floating Filters Button (kept) */}
      <button
        type="button"
        className={cn(
          "fixed bottom-5 right-5 z-40 hidden items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white shadow-2xl md:inline-flex",
          "active:scale-[0.99] cursor-pointer"
        )}
        style={{ backgroundColor: PALETTE.navy }}
        aria-label="Open filters"
      >
        <FiSliders className="h-4 w-4" style={{ color: PALETTE.gold }} />
        Filters
      </button>
    </div>
  );
}
