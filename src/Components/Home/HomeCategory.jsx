import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  gold: "#eab308",
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

/* -------------------- HEADER UI (UPDATED) -------------------- */
function SectionHeader({
  title,
  subtitle = "Browse popular picks",
  accent = "coral",
  center = true,
}) {
  const accentColor = accent === "gold" ? PALETTE.gold : PALETTE.coral;

  // Make ONLY "Categories" have a gradient background with WHITE text
  const parts = String(title).split(/\bCategories\b/);

  return (
    <div
      className={cn("flex flex-col gap-2", center ? "items-center text-center" : "")}
    >
      {/* Accent pill */}
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold",
          "ring-1 ring-black/5 bg-white"
        )}
        style={{ boxShadow: "0 10px 24px rgba(0,31,63,.06)" }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: accentColor }}
          aria-hidden="true"
        />
        <span style={{ color: PALETTE.navy, opacity: 0.85 }}>Explore</span>
      </div>

      {/* Title */}
      <div
        className={cn("text-2xl font-black tracking-tight sm:text-[30px]")}
        style={{ color: PALETTE.navy }}
      >
        {parts.length > 1 ? (
          <>
            {parts[0]}
            <span
              className={cn("inline-flex items-center rounded-xl px-2.5 py-1", "text-white")}
              style={{
                backgroundImage: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.gold})`,
                boxShadow: "0 10px 24px rgba(0,31,63,.10)",
              }}
            >
              Categories
            </span>
            {parts.slice(1).join("Categories")}
          </>
        ) : (
          title
        )}
      </div>

      {/* Subtitle */}
      {subtitle ? (
        <div className="text-[13px] sm:text-sm" style={{ color: "rgba(0,31,63,0.62)" }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

/* -------------------- SKELETONS (NO styled-jsx = hydration safe) -------------------- */
function CategoryCardSkeleton() {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-white ring-1 ring-black/5",
        "rounded-3xl p-3 sm:p-4 lg:p-4",
        "select-none"
      )}
      style={{ boxShadow: "0 12px 30px rgba(0,31,63,.06)" }}
      aria-hidden="true"
    >
      {/* soft pulse overlay */}
      <div className="pointer-events-none absolute inset-0 animate-pulse bg-black/[0.02]" />

      {/* Title skeleton */}
      <div className="relative flex justify-center">
        <div
          className="h-3 w-16 rounded-full sm:h-3.5 sm:w-20 lg:w-24"
          style={{ backgroundColor: "rgba(0,31,63,0.10)" }}
        />
      </div>

      {/* Image skeleton */}
      <div className="relative mt-3 flex items-center justify-center">
        <div
          className={cn(
            "relative ring-1 ring-black/5",
            "h-16 w-16 rounded-[1.25rem]",
            "sm:h-[72px] sm:w-[72px] sm:rounded-[1.5rem]",
            "lg:h-[78px] lg:w-[78px] lg:rounded-[1.65rem]"
          )}
          style={{
            background:
              "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.12), rgba(0,31,63,0.06) 60%), #fff",
          }}
        >
          <div
            className="absolute inset-0 m-auto h-10 w-10 rounded-2xl"
            style={{ backgroundColor: "rgba(0,31,63,0.10)" }}
          />
          <span
            className={cn(
              "absolute -right-1 -top-1 rounded-full ring-2 ring-white",
              "h-2.5 w-2.5",
              "sm:h-3 sm:w-3"
            )}
            style={{ backgroundColor: PALETTE.gold, opacity: 0.65 }}
          />
        </div>
      </div>

      {/* Bottom progress skeleton */}
      <div className="relative mt-3 flex justify-center">
        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-black/5 sm:w-14 lg:w-16">
          <div
            className="h-full w-2/3 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,126,105,0.35), rgba(234,179,8,0.35))",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid({ desktopCount = 21, mobileCount = 9 }) {
  return (
    <>
      {/* MOBILE skeleton */}
      <div className="mt-6 sm:hidden">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: mobileCount }).map((_, i) => (
            <CategoryCardSkeleton key={`m-skel-${i}`} />
          ))}
        </div>
      </div>

      {/* DESKTOP/TABLET skeleton */}
      <div className="mt-6 hidden sm:grid sm:grid-cols-4 sm:gap-3 md:grid-cols-6 md:gap-3 lg:grid-cols-7 lg:gap-4">
        {Array.from({ length: desktopCount }).map((_, i) => (
          <CategoryCardSkeleton key={`d-skel-${i}`} />
        ))}
      </div>
    </>
  );
}

/* -------------------- COMPONENT -------------------- */
export default function HomeCategory({
  onSelect,
  title = "Popular Categories",
  subtitle = "Browse popular picks",
  limit = 200,
  endpoint = "/api/categories?subView=home",
}) {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [items, setItems] = useState([]); // flattened subcategories
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Mobile grid is 3 columns, 3 rows => 9 items
  const MOBILE_INITIAL_COUNT = 9;

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError("");

        const origin =
          typeof window !== "undefined" ? window.location.origin : "http://localhost";
        const url = new URL(endpoint, origin);

        // optional: allow overriding limit
        if (!url.searchParams.get("limit")) url.searchParams.set("limit", String(limit));

        // we need subcategories
        if (!url.searchParams.get("includeSub")) url.searchParams.set("includeSub", "true");

        if (!url.searchParams.get("subView")) url.searchParams.set("subView", "home");

        // ✅ cache-bust to avoid any browser/proxy/CDN caching (client-side only)
        url.searchParams.set("_ts", String(Date.now()));

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Failed to load categories (${res.status})`);

        const data = await res.json();
        const cats = Array.isArray(data?.items) ? data.items : [];

        // Flatten subcategories across categories
        const flat = [];
        for (const c of cats) {
          const catSlug = c?.slug || "";
          const subs = Array.isArray(c?.subcategories) ? c.subcategories : [];
          for (const s of subs) {
            const label = s?.name || "";
            const img = s?.image?.url || "";
            if (!label || !img) continue;
            flat.push({
              label,
              img,
              alt: s?.image?.alt || label,
              categorySlug: catSlug,
              subSlug: s?.slug || "",
            });
          }
        }

        setItems(flat);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [endpoint, limit]);

  const mobileInitial = useMemo(() => items.slice(0, MOBILE_INITIAL_COUNT), [items]);
  const mobileRest = useMemo(() => items.slice(MOBILE_INITIAL_COUNT), [items]);
  const hasMore = mobileRest.length > 0;

  return (
    <section className="mt-10">
      {/* ✅ Updated header design + gradient BG on "Categories" with white text */}
      <SectionHeader title={title} subtitle={subtitle} accent="coral" center />

      {/* ✅ Skeleton only (NO "Loading..." text) */}
      {loading && <SkeletonGrid desktopCount={21} mobileCount={9} />}

      {!loading && error && (
        <div className="mt-6 flex justify-center text-sm" style={{ color: PALETTE.navy }}>
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="mt-6 flex justify-center text-sm" style={{ color: PALETTE.navy }}>
          No categories found.
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          {/* ✅ MOBILE (base): show 3 rows, then See more */}
          <div className="mt-6 sm:hidden">
            <div className="grid grid-cols-3 gap-2">
              {mobileInitial.map((it) => (
                <CategoryCard
                  key={`${it.categorySlug}:${it.subSlug || it.label}`}
                  label={it.label}
                  img={it.img}
                  alt={it.alt}
                  onSelect={onSelect}
                  meta={it}
                />
              ))}

              {mobileExpanded &&
                mobileRest.map((it) => (
                  <CategoryCard
                    key={`${it.categorySlug}:${it.subSlug || it.label}`}
                    label={it.label}
                    img={it.img}
                    alt={it.alt}
                    onSelect={onSelect}
                    meta={it}
                  />
                ))}
            </div>

            {hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setMobileExpanded((v) => !v)}
                  className={cn(
                    "rounded-full px-5 py-2 text-[13px] font-semibold",
                    "ring-1 ring-black/10 bg-white",
                    "transition hover:shadow-md active:scale-[0.99]",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  )}
                  style={{
                    color: PALETTE.navy,
                    outlineColor: PALETTE.coral,
                    boxShadow: "0 10px 25px rgba(0,31,63,.08)",
                  }}
                  aria-expanded={mobileExpanded}
                >
                  {mobileExpanded ? "See less" : "See more"}
                </button>
              </div>
            )}
          </div>

          {/* ✅ SM+ (tablet/desktop): show all */}
          <div className="mt-6 hidden sm:grid sm:grid-cols-4 sm:gap-3 md:grid-cols-6 md:gap-3 lg:grid-cols-7 lg:gap-4">
            {items.map((it) => (
              <CategoryCard
                key={`${it.categorySlug}:${it.subSlug || it.label}`}
                label={it.label}
                img={it.img}
                alt={it.alt}
                onSelect={onSelect}
                meta={it}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* -------------------- CARD -------------------- */
function CategoryCard({ label, img, alt, onSelect, meta }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.({ label, ...meta })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect?.({ label, ...meta });
      }}
      className={cn(
        "group relative overflow-hidden bg-white ring-1 ring-black/5",
        "rounded-3xl p-3 sm:p-4 lg:p-4",
        "cursor-pointer",
        "transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]",
        "motion-reduce:transition-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      )}
      style={{
        boxShadow: "0 12px 30px rgba(0,31,63,.06)",
        outlineColor: PALETTE.coral,
      }}
    >
      {/* Title */}
      <div
        className="cursor-pointer text-center text-[12px] font-semibold leading-tight sm:text-[13px] lg:text-[13.5px]"
        style={{ color: PALETTE.navy }}
      >
        {label}
      </div>

      {/* Image */}
      <div className="mt-3 flex cursor-pointer items-center justify-center">
        <div
          className={cn(
            "relative flex cursor-pointer items-center justify-center ring-1 ring-black/5",
            "h-16 w-16 rounded-[1.25rem]",
            "sm:h-[72px] sm:w-[72px] sm:rounded-[1.5rem]",
            "lg:h-[78px] lg:w-[78px] lg:rounded-[1.65rem]"
          )}
          style={{
            background:
              "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.16), rgba(0,31,63,0.05) 60%), #fff",
          }}
        >
          <Image
            src={img}
            alt={alt || label}
            width={52}
            height={52}
            className="pointer-events-none h-11 w-11 object-contain sm:h-12 sm:w-12 lg:h-[52px] lg:w-[52px]"
            priority={false}
          />
          <span
            className={cn(
              "pointer-events-none absolute -right-1 -top-1 rounded-full ring-2 ring-white",
              "h-2.5 w-2.5",
              "sm:h-3 sm:w-3"
            )}
            style={{ backgroundColor: PALETTE.gold }}
          />
        </div>
      </div>

      {/* Bottom progress line */}
      <div className="mt-3 flex cursor-pointer justify-center">
        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-black/5 sm:w-14 lg:w-16">
          <div
            className="h-full w-0 rounded-full transition-all duration-300 group-hover:w-full motion-reduce:transition-none"
            style={{
              background: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.gold})`,
            }}
          />
        </div>
      </div>
    </button>
  );
}