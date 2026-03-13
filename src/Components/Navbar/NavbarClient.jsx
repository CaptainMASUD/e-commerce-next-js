"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useNav from "@/Components/Utils/useNav";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MapPin,
  ShieldCheck,
  ArrowRight,
  House,
  LayoutGrid,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

const COLORS = {
  cta: "#ff6b6b",
  accent2: "#ff7e69",
  navy: "#001f3f",

  headerBg: "#071a2d",
  headerBg2: "#061325",
  headerBorder: "rgba(255,255,255,0.12)",
  headerText: "rgba(255,255,255,0.92)",
  headerMuted: "rgba(255,255,255,0.72)",
  inputBg: "rgba(255,255,255,0.08)",
  inputBorder: "rgba(255,255,255,0.14)",
};

const cx = (...c) => c.filter(Boolean).join(" ");

/* -------------------- hooks -------------------- */

function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [locked]);
}

function useEscape(onEscape, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e) => e.key === "Escape" && onEscape?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onEscape, enabled]);
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const apply = () => setReduced(!!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  return reduced;
}

function useFocusTrap(active, containerRef, { onEscape } = {}) {
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!active) return;

    previouslyFocused.current = document.activeElement;

    const container = containerRef.current;
    if (!container) return;

    const getFocusable = () =>
      Array.from(
        container.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));

    const focusables = getFocusable();
    (focusables[0] || container).focus?.();

    const onKeyDown = (e) => {
      if (e.key === "Escape") onEscape?.();
      if (e.key !== "Tab") return;

      const f = getFocusable();
      if (!f.length) return;

      const first = f[0];
      const last = f[f.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, containerRef, onEscape]);

  useEffect(() => {
    if (active) return;
    previouslyFocused.current?.focus?.();
  }, [active]);
}

/* -------------------- auth helpers -------------------- */

function getStoredAuth() {
  try {
    const localToken = localStorage.getItem("token");
    const sessionToken = sessionStorage.getItem("token");
    const token = localToken || sessionToken || "";

    const localUser = localStorage.getItem("auth_user");
    const sessionUser = sessionStorage.getItem("auth_user");
    const rawUser = localUser || sessionUser || "";

    let user = null;
    if (rawUser) {
      try {
        user = JSON.parse(rawUser);
      } catch {
        user = null;
      }
    }

    return {
      isAuthenticated: !!token,
      user,
    };
  } catch {
    return {
      isAuthenticated: false,
      user: null,
    };
  }
}

function clearStoredAuth() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("auth_user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("auth_user");
  } catch {}
}

function getUserDisplayName(user) {
  if (!user) return "";
  return (
    user.name ||
    user.username ||
    user.fullName ||
    user.displayName ||
    user.firstName ||
    user.email?.split("@")?.[0] ||
    "Account"
  );
}

/* -------------------- atoms -------------------- */

function TopLink({ href, children, className = "", activeClassName = "", tone = "light" }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const isDark = tone === "dark";

  return (
    <Link
      href={href}
      className={cx(
        "cursor-pointer inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition",
        "focus:outline-none focus-visible:ring-2",
        isDark ? "hover:bg-white/10 focus-visible:ring-white/30" : "hover:bg-black/5 focus-visible:ring-black/20",
        isActive && (isDark ? "bg-white/10" : "bg-black/5"),
        isActive && activeClassName,
        className
      )}
      style={{ color: isDark ? COLORS.headerText : COLORS.navy }}
    >
      {children}
    </Link>
  );
}

function IconButton({ label, children, onClick, className = "", tone = "light" }) {
  const isDark = tone === "dark";
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cx(
        "cursor-pointer relative inline-flex items-center justify-center rounded-lg transition",
        "h-8 w-8 sm:h-9 sm:w-9",
        "focus:outline-none focus-visible:ring-2",
        isDark ? "hover:bg-white/10 focus-visible:ring-white/30" : "hover:bg-black/5 focus-visible:ring-black/20",
        className
      )}
      style={{ color: isDark ? COLORS.headerText : COLORS.navy }}
      type="button"
    >
      {children}
    </button>
  );
}

function Badge({ children }) {
  return (
    <span
      className={cx(
        "absolute -right-0.5 -top-0.5 inline-flex items-center justify-center rounded-full px-1 font-semibold shadow",
        "h-4 min-w-[1rem] text-[10px]",
        "sm:h-5 sm:min-w-[1.25rem] sm:text-[11px]"
      )}
      style={{ background: COLORS.cta, color: "white" }}
    >
      {children}
    </span>
  );
}

function SuggestionDropdown({
  open,
  loading,
  items,
  query,
  onPick,
  onSearchAll,
  anchor = "desktop",
}) {
  if (!open) return null;

  return (
    <div
      className={cx(
        "absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl",
        anchor === "mobile" ? "top-[calc(100%+6px)]" : ""
      )}
    >
      {loading ? (
        <div className="px-4 py-4 text-sm text-black/50">Searching...</div>
      ) : items.length ? (
        <>
          <div className="max-h-[360px] overflow-y-auto">
            {items.map((item) => (
              <button
                key={item._id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPick(item)}
                className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-black/5 ring-1 ring-black/10">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name || ""}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-black/35">No image</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold" style={{ color: COLORS.navy }}>
                    {item.name}
                  </div>

                  <div className="mt-0.5 truncate text-xs text-black/50">
                    {[item.brand?.name, item.category?.name].filter(Boolean).join(" • ")}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold" style={{ color: COLORS.navy }}>
                    ৳{Number(item.finalPrice || 0).toLocaleString()}
                  </div>
                  {item.discountPrice && item.normalPrice > item.finalPrice ? (
                    <div className="text-[11px] text-black/40 line-through">
                      ৳{Number(item.normalPrice || 0).toLocaleString()}
                    </div>
                  ) : null}
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-black/10 bg-black/[0.02] p-2">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onSearchAll}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white shadow hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              style={{ background: COLORS.cta }}
            >
              Search for "{query}"
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      ) : (
        <div className="px-4 py-4 text-sm text-black/50">
          No products found for "{query}"
        </div>
      )}
    </div>
  );
}

/* -------------------- desktop user menu -------------------- */

function DesktopUserMenu({ user, onProfile, onLogout }) {
  const displayName = getUserDisplayName(user);
  const profileImage = user?.image || user?.avatar || user?.photoURL || user?.profileImage || "";

  return (
    <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
      <div className="border-b border-black/10 px-4 py-3">
        <div className="flex items-center gap-3">
          {profileImage ? (
            <span className="h-11 w-11 overflow-hidden rounded-full ring-1 ring-black/10 shrink-0">
              <img
                src={profileImage}
                alt={displayName}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </span>
          ) : (
            <span
              className="inline-flex h-11 w-11 items-center justify-center rounded-full shrink-0"
              style={{ background: "rgba(0,31,63,0.06)" }}
            >
              <User className="h-5 w-5" style={{ color: COLORS.navy }} />
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold" style={{ color: COLORS.navy }}>
              {displayName}
            </div>
            {user?.email ? (
              <div className="truncate text-xs text-black/50">{user.email}</div>
            ) : (
              <div className="truncate text-xs text-black/50">Signed in</div>
            )}
          </div>
        </div>
      </div>

      <div className="p-1.5">
        <button
          type="button"
          onClick={onProfile}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <LayoutDashboard className="h-4 w-4 text-black/60" />
          <span className="text-sm font-semibold" style={{ color: COLORS.navy }}>
            Dashboard
          </span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <LogOut className="h-4 w-4 text-black/60" />
          <span className="text-sm font-semibold" style={{ color: COLORS.navy }}>
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}

/* -------------------- Mobile drawer pieces -------------------- */

function ListCard({ title, right, children }) {
  return (
    <div className="w-full max-w-full rounded-2xl border border-black/10 bg-white overflow-hidden">
      {title ? (
        <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-black/50 border-b border-black/10 min-w-0">
          <div className="truncate min-w-0">{title}</div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      ) : null}
      <div className="w-full max-w-full">{children}</div>
    </div>
  );
}

function MobileListItem({ label, right, onClick, subtitle, active = false, leftThumbUrl }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "cursor-pointer w-full max-w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition",
        "hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
        active && "bg-black/5"
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {leftThumbUrl ? (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 ring-1 ring-black/10 shrink-0 overflow-hidden">
            <img
              src={leftThumbUrl}
              alt=""
              className="h-full w-full object-cover max-w-full"
              loading="lazy"
              decoding="async"
            />
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate min-w-0" style={{ color: COLORS.navy }}>
            {label}
          </div>
          {subtitle ? <div className="text-xs text-black/50 truncate min-w-0">{subtitle}</div> : null}
        </div>
      </div>

      <div className="shrink-0">{right ? right : <ChevronRight className="h-4 w-4 text-black/40" />}</div>
    </button>
  );
}

function MobileSubHeader({ title, onBack, onViewAll }) {
  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-black/10">
      <div className="flex items-center gap-2 px-2 py-2 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 shrink-0"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5 text-black/70" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold min-w-0" style={{ color: COLORS.navy }}>
            {title}
          </div>
          <div className="text-xs text-black/50 truncate min-w-0">Choose a sub-category</div>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 shrink-0"
          style={{ background: COLORS.cta }}
        >
          View all <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* -------------------- Mobile Bottom Navigation -------------------- */

function MobileBottomNav({
  onToggleCategories,
  onCloseCategories,
  cartCount = 0,
  isCategoriesOpen = false,
  isAuthenticated = false,
  user = null,
}) {
  const nav = useNav();
  const pathname = usePathname();

  const handleNavigate = (to) => {
    onCloseCategories?.();
    nav.push(to);
  };

  const profileImage = user?.image || user?.avatar || user?.photoURL || user?.profileImage || "";

  const items = [
    {
      key: "home",
      label: "Home",
      icon: House,
      active: pathname === "/" && !isCategoriesOpen,
      onClick: () => handleNavigate("/"),
    },
    {
      key: "categories",
      label: "Categorie",
      icon: LayoutGrid,
      active: isCategoriesOpen,
      onClick: () => onToggleCategories?.(),
    },
    {
      key: "cart",
      label: "Cart",
      icon: ShoppingCart,
      active: pathname === "/cart" && !isCategoriesOpen,
      onClick: () => handleNavigate("/cart"),
      badge: cartCount,
    },
    isAuthenticated
      ? {
          key: "profile",
          label: "Profile",
          icon: User,
          active: pathname === "/profile" && !isCategoriesOpen,
          onClick: () => handleNavigate("/profile"),
          image: profileImage,
        }
      : {
          key: "login",
          label: "Login",
          icon: User,
          active: pathname === "/login" && !isCategoriesOpen,
          onClick: () => handleNavigate("/login"),
        },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur lg:hidden">
      <div
        className="grid grid-cols-4 gap-1 px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+8px)]"
        style={{ boxShadow: "0 -8px 24px rgba(0,0,0,0.08)" }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className={cx(
                "relative inline-flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
                item.active ? "bg-black/5" : "hover:bg-black/5"
              )}
              style={{ color: item.active ? COLORS.cta : COLORS.navy }}
              aria-label={item.label}
            >
              <span className="relative inline-flex">
                {item.image ? (
                  <span className="h-[18px] w-[18px] overflow-hidden rounded-full ring-1 ring-black/10">
                    <img
                      src={item.image}
                      alt={item.label}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                ) : (
                  <Icon className="h-[18px] w-[18px]" />
                )}

                {item.badge > 0 ? (
                  <span
                    className="absolute -right-2 -top-2 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white shadow"
                    style={{ background: COLORS.cta }}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </span>

              <span className="text-[10px] font-semibold leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------- helpers -------------------- */

const safeSeg = (v) => encodeURIComponent(String(v || "").trim());

/* -------------------- Mobile Drawer -------------------- */

function MobileDrawer({ open, onClose, mobileGroups }) {
  const nav = useNav();
  const pathname = usePathname();

  const reducedMotion = usePrefersReducedMotion();
  useEscape(onClose, open);
  useBodyScrollLock(open);

  const drawerRef = useRef(null);
  useFocusTrap(open, drawerRef, { onEscape: onClose });

  const [panel, setPanel] = useState({ screen: "main" });

  useEffect(() => {
    if (!open) return;
    setPanel({ screen: "main" });
  }, [open]);

  const anim = reducedMotion ? "duration-0" : "duration-200";

  const go = (to) => {
    nav.push(to);
    onClose?.();
  };

  const isActiveRoute = (to) => pathname === to;

  const openCategory = (g) =>
    setPanel({
      screen: "category",
      groupTitle: g.title,
      items: g.items,
      slug: g.slug,
    });

  return (
    <>
      <div
        className={cx(
          "fixed inset-0 z-50 bg-black/35 transition-opacity",
          anim,
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      <div
        ref={drawerRef}
        tabIndex={-1}
        className={cx(
          "fixed inset-y-0 left-0 z-50 w-[90%] max-w-sm",
          "transform border-r border-black/10 bg-white shadow-2xl transition",
          "overflow-x-hidden",
          anim,
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        <div className="flex h-full flex-col overflow-x-hidden min-w-0 max-w-full">
          <div className="p-4 overflow-x-hidden">
            <div className="flex items-center justify-between min-w-0">
              <button
                type="button"
                onClick={() => go("/")}
                className="cursor-pointer group inline-flex items-center gap-3 px-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 min-w-0"
              >
                <Image
                  src="/assets/logo/logo2.png"
                  alt="AURA & OHM"
                  width={120}
                  height={40}
                  className="h-10 w-auto object-contain"
                  priority
                />
                <div className="leading-tight text-left min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: COLORS.navy }}>
                    AURA &amp; OHM
                  </div>
                  <div className="text-xs text-black/60 truncate">Browse categories</div>
                </div>
              </button>

              <button
                onClick={onClose}
                className="cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-xl text-black/70 hover:bg-black/5 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 shrink-0"
                aria-label="Close menu"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-6 min-w-0">
            <div className="relative min-w-0">
              <div
                className={cx(
                  "transition-transform ease-out min-w-0",
                  anim,
                  panel.screen === "main"
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-[8%] opacity-0 pointer-events-none"
                )}
              >
                <ListCard title="Menu">
                  <div className="border-b border-black/10 last:border-b-0">
                    <MobileListItem
                      label="Home"
                      subtitle="Featured & new"
                      onClick={() => go("/")}
                      active={isActiveRoute("/")}
                    />
                  </div>

                  {mobileGroups.map((g) => (
                    <div key={g.key} className="border-b border-black/10 last:border-b-0">
                      <MobileListItem
                        label={g.title}
                        subtitle={`${g.items.length} options`}
                        onClick={() => openCategory(g)}
                        leftThumbUrl={g.thumbUrl}
                      />
                    </div>
                  ))}

                  <div className="border-b border-black/10 last:border-b-0">
                    <MobileListItem
                      label="Brands"
                      subtitle="All brands"
                      onClick={() => go("/brands")}
                      active={isActiveRoute("/brands")}
                    />
                  </div>

                  <div className="border-b border-black/10 last:border-b-0">
                    <MobileListItem
                      label="New Arrivals"
                      subtitle="Latest products"
                      onClick={() => go("/new-arrivals")}
                      active={isActiveRoute("/new-arrivals")}
                    />
                  </div>
                </ListCard>
              </div>

              <div
                className={cx(
                  "absolute inset-0 transition-transform ease-out bg-white min-w-0",
                  anim,
                  panel.screen === "category"
                    ? "translate-x-0 opacity-100"
                    : "translate-x-full opacity-0 pointer-events-none"
                )}
              >
                <MobileSubHeader
                  title={panel.screen === "category" ? panel.groupTitle : ""}
                  onBack={() => setPanel({ screen: "main" })}
                  onViewAll={() => {
                    const catSlug = panel.slug || "";
                    go(`/c/${safeSeg(catSlug)}`);
                  }}
                />

                <div className="p-4 overflow-x-hidden">
                  <ListCard title="Sub-categories">
                    {(panel.screen === "category" ? panel.items : []).map((it) => (
                      <div key={it.slug || it.name} className="border-b border-black/10 last:border-b-0">
                        <MobileListItem
                          label={it.name}
                          onClick={() => {
                            const catSlug = panel.slug || "";
                            const subSlug = it.slug || it.name || "";
                            go(`/c/${safeSeg(catSlug)}/${safeSeg(subSlug)}`);
                          }}
                          subtitle="Browse products"
                        />
                      </div>
                    ))}
                    {panel.screen === "category" && !(panel.items || []).length ? (
                      <div className="px-3 py-3 text-sm text-black/50">No sub-categories yet.</div>
                    ) : null}
                  </ListCard>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* -------------------- Category Bar (desktop) -------------------- */

function CategoryBar({ items }) {
  const reducedMotion = usePrefersReducedMotion();
  const nav = useNav();

  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState(items[0]?.key || "");
  const closeTimer = useRef(null);

  const barRef = useRef(null);
  const dropdownRef = useRef(null);

  const SUBMENU_WIDTH = 340;
  const [pos, setPos] = useState({ left: 0, top: 0, width: SUBMENU_WIDTH });

  const active = useMemo(() => items.find((x) => x.key === activeKey) || items[0], [items, activeKey]);

  const clearTimer = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const closeAll = () => {
    clearTimer();
    setOpen(false);
  };

  useEscape(closeAll, open);

  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      const t = e.target;
      if (barRef.current?.contains(t)) return;
      if (dropdownRef.current?.contains(t)) return;
      closeAll();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const computePos = () => {
    const bar = barRef.current;
    if (!bar) return;
    const btn = bar.querySelector(`[data-cat="${activeKey}"]`);
    const barRect = bar.getBoundingClientRect();
    const btnRect = btn?.getBoundingClientRect();

    const vw = window.innerWidth;
    const width = SUBMENU_WIDTH;

    const desiredLeft = btnRect ? btnRect.left + btnRect.width / 2 - width / 2 : vw / 2 - width / 2;
    const left = Math.max(16, Math.min(desiredLeft, vw - width - 16));
    const top = barRect.bottom + 8;

    setPos({ left, top, width });
  };

  useEffect(() => {
    if (!open) return;
    computePos();
    const onResize = () => computePos();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, activeKey]);

  const anim = reducedMotion ? "duration-0" : "duration-150";

  const goToCategory = useCallback(
    (catSlug) => {
      nav.push(`/c/${safeSeg(catSlug)}`);
    },
    [nav]
  );

  const goToSub = useCallback(
    (catSlug, subSlug) => {
      nav.push(`/c/${safeSeg(catSlug)}/${safeSeg(subSlug)}`);
    },
    [nav]
  );

  return (
    <>
      <div className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-screen-2xl px-6 sm:px-10 lg:px-12 xl:px-14">
          <div
            ref={barRef}
            className="flex flex-wrap items-center justify-center gap-2 py-1.5"
            onMouseEnter={() => clearTimer()}
            onMouseLeave={() => {
              clearTimer();
              closeTimer.current = window.setTimeout(() => setOpen(false), 140);
            }}
          >
            {items.map((c) => {
              const isActive = c.key === activeKey && open;
              return (
                <button
                  key={c.key}
                  data-cat={c.key}
                  type="button"
                  onMouseEnter={() => {
                    setActiveKey(c.key);
                    setOpen(true);
                  }}
                  onClick={() => {
                    setActiveKey(c.key);
                    setOpen((v) => !v);
                  }}
                  className={cx(
                    "cursor-pointer inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition",
                    "hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
                    isActive && "bg-black/5"
                  )}
                  style={{ color: COLORS.navy }}
                  aria-expanded={isActive}
                >
                  <span className="truncate max-w-[180px]">{c.label}</span>
                  <ChevronDown className={cx("h-4 w-4 transition shrink-0", isActive && "rotate-180")} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className={cx("fixed z-50", anim, open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}
        style={{ left: pos.left, top: pos.top, width: pos.width }}
        onMouseEnter={() => clearTimer()}
        onMouseLeave={() => {
          clearTimer();
          closeTimer.current = window.setTimeout(() => setOpen(false), 140);
        }}
      >
        <div ref={dropdownRef} className="rounded-2xl border border-black/10 bg-white shadow-2xl overflow-hidden" role="menu">
          <div className="flex items-center justify-between border-b border-black/10 px-3 py-2 min-w-0">
            <div className="text-xs font-semibold text-black/50 truncate min-w-0">{active?.label}</div>
            <button
              type="button"
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 shrink-0"
              style={{ background: COLORS.cta }}
              onClick={() => {
                closeAll();
                goToCategory(active?.slug || active?.key || "");
              }}
            >
              View all <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="p-1.5">
            {(active?.items || []).length ? (
              <div className="grid grid-cols-1 gap-0.5">
                {(active.items || []).map((s) => (
                  <button
                    key={s.slug || s.name}
                    type="button"
                    className={cx(
                      "cursor-pointer w-full flex items-center justify-between rounded-xl px-3 py-1.5 text-left min-w-0",
                      "hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                    )}
                    style={{ color: COLORS.navy }}
                    onClick={() => {
                      closeAll();
                      goToSub(active?.slug || active?.key || "", s.slug || s.name || "");
                    }}
                  >
                    <span className="text-sm font-semibold truncate min-w-0 flex-1">{s.name}</span>
                    <ChevronRight className="h-4 w-4 text-black/40 shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-3 text-sm text-black/50">No sub-categories yet.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* -------------------- Main Navbar -------------------- */

export default function NavbarClient({
  initialCategories = [],
  initialCatError = null,
  user = null,
  isAuthenticated = false,
}) {
  const nav = useNav();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopUserMenuOpen, setDesktopUserMenuOpen] = useState(false);

  const cartCount = 2;

  const categories = initialCategories;
  const isLoading = false;
  const error = initialCatError;

  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const desktopUserMenuRef = useRef(null);

  const [clientAuth, setClientAuth] = useState({
    isAuthenticated: !!isAuthenticated,
    user: user || null,
  });

  useEffect(() => {
    const stored = getStoredAuth();
    setClientAuth({
      isAuthenticated: stored.isAuthenticated || !!isAuthenticated,
      user: stored.user || user || null,
    });
  }, [isAuthenticated, user]);

  const mergedIsAuthenticated = clientAuth.isAuthenticated;
  const mergedUser = clientAuth.user || user || null;
  const displayName = getUserDisplayName(mergedUser);
  const profileImage = mergedUser?.image || mergedUser?.avatar || mergedUser?.photoURL || mergedUser?.profileImage || "";

  const go = useCallback(
    (to) => {
      setMobileOpen(false);
      setDesktopUserMenuOpen(false);
      nav.push(to);
    },
    [nav]
  );

  const handleLogout = useCallback(() => {
    clearStoredAuth();
    setDesktopUserMenuOpen(false);
    setMobileOpen(false);
    setClientAuth({
      isAuthenticated: false,
      user: null,
    });
    nav.push("/");
  }, [nav]);

  const submitSearch = useCallback(
    (forcedValue) => {
      const q = String(forcedValue ?? search ?? "").trim();

      setShowSuggest(false);
      setMobileOpen(false);

      if (!q) {
        go("/product");
        return;
      }

      const qs = new URLSearchParams({ q }).toString();
      go(`/product?${qs}`);
    },
    [search, go]
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    submitSearch();
  };

  const handleSuggestionPick = useCallback(
    (item) => {
      setShowSuggest(false);
      setSuggestions([]);
      setSearch(item?.name || "");
      setMobileOpen(false);
      go(`/product/${encodeURIComponent(item.slug || "")}`);
    },
    [go]
  );

  const toggleMobileCategories = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const closeMobileCategories = useCallback(() => {
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    const q = search.trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    if (q.length < 2) {
      setSuggestions([]);
      setSuggestLoading(false);
      setShowSuggest(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const controller = new AbortController();
        abortRef.current = controller;

        setSuggestLoading(true);
        setShowSuggest(true);

        const qs = new URLSearchParams({
          q,
          limit: "6",
        }).toString();

        const res = await fetch(`/api/products/search/suggest?${qs}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json?.message || "Failed to fetch suggestions");
        }

        setSuggestions(Array.isArray(json?.suggestions) ? json.suggestions : []);
      } catch (error) {
        if (error?.name === "AbortError") return;
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  useEffect(() => {
    const onDocClick = (e) => {
      const target = e.target;
      if (desktopSearchRef.current?.contains(target)) return;
      if (mobileSearchRef.current?.contains(target)) return;
      setShowSuggest(false);

      if (desktopUserMenuRef.current?.contains(target)) return;
      setDesktopUserMenuOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDesktopUserMenuOpen(false);
  }, [pathname]);

  const mobileGroups = useMemo(() => {
    return categories.map((c) => ({
      key: c.slug || c.id,
      title: c.label,
      slug: c.slug,
      thumbUrl: c.subcategories?.[0]?.image?.url || "",
      items: (c.subcategories || []).map((s) => ({
        name: s.name,
        slug: s.slug,
        image: s.image,
        sortOrder: s.sortOrder ?? 0,
      })),
    }));
  }, [categories]);

  const desktopCategoryBar = useMemo(() => {
    return categories.map((c) => ({
      key: c.slug || c.id,
      label: c.label,
      slug: c.slug,
      items: (c.subcategories || []).map((s) => ({
        name: s.name,
        slug: s.slug,
        image: s.image,
        sortOrder: s.sortOrder ?? 0,
      })),
    }));
  }, [categories]);

  useEscape(() => setMobileOpen(false), mobileOpen);
  useEscape(() => setDesktopUserMenuOpen(false), desktopUserMenuOpen);

  return (
    <>
      <header className="sticky top-0 z-40">
        <div
          style={{
            background: `linear-gradient(180deg, ${COLORS.headerBg} 0%, ${COLORS.headerBg2} 100%)`,
            borderBottom: `1px solid ${COLORS.headerBorder}`,
          }}
        >
          <div className="hidden lg:block">
            <div style={{ borderBottom: `1px solid ${COLORS.headerBorder}` }}>
              <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-2 text-[11px] sm:px-10 lg:px-12 xl:px-14">
                <div className="flex items-center gap-2" style={{ color: COLORS.headerMuted }}>
                  <ShieldCheck className="h-3.5 w-3.5" style={{ color: COLORS.headerText }} />
                  <span>Official warranty • Easy returns • Secure checkout</span>
                </div>

                <div className="flex items-center gap-3" style={{ color: COLORS.headerMuted }}>
                  <Link
                    href="/categories"
                    className="cursor-pointer rounded px-1.5 py-1 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    style={{ color: COLORS.headerMuted }}
                  >
                    Help
                  </Link>
                  <span style={{ color: "rgba(255,255,255,0.25)" }}>•</span>
                  <Link
                    href="/order-tracking"
                    className="cursor-pointer rounded px-1.5 py-1 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    style={{ color: COLORS.headerMuted }}
                  >
                    Track order
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-screen-2xl px-6 py-2 sm:px-10 lg:px-12 xl:px-14">
            <div className="flex items-center gap-2.5">
              <div className="lg:hidden">
                <IconButton label="Open menu" onClick={() => setMobileOpen(true)} tone="dark">
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                </IconButton>
              </div>

              <button
                type="button"
                onClick={() => go("/")}
                className="cursor-pointer group flex items-center gap-2.5 sm:gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 min-w-0"
              >
                <Image
                  src="/assets/logo/logo1.png"
                  alt="AURA & OHM"
                  width={120}
                  height={40}
                  className="h-8 sm:h-9 w-auto object-contain"
                  priority
                />
                <div className="leading-tight text-left min-w-0">
                  <div
                    className="text-[12px] sm:text-[15px] font-semibold tracking-tight whitespace-nowrap truncate"
                    style={{ color: COLORS.headerText }}
                  >
                    AURA &amp; OHM
                  </div>
                  <div className="text-[10px] sm:text-[11px] -mt-0.5 truncate" style={{ color: COLORS.headerMuted }}>
                    E-commerce store
                  </div>
                </div>
              </button>

              <nav className="relative ml-3 hidden items-center gap-1.5 lg:flex" aria-label="Primary">
                <TopLink href="/" tone="dark" activeClassName="ring-1 ring-white/20">
                  Home
                </TopLink>

                <TopLink href="/brands" tone="dark" activeClassName="ring-1 ring-white/20">
                  Brands
                </TopLink>

                <TopLink href="/new-arrivals" tone="dark" activeClassName="ring-1 ring-white/20">
                  New Arrivals
                </TopLink>
              </nav>

              <div className="ml-auto hidden flex-1 lg:block">
                <div className="mx-auto max-w-2xl">
                  <div ref={desktopSearchRef} className="relative">
                    <form onSubmit={handleSearchSubmit} className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4" style={{ color: COLORS.headerMuted }} />
                      </div>

                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => {
                          if (search.trim().length >= 2) setShowSuggest(true);
                        }}
                        className={cx(
                          "h-10 w-full rounded-2xl px-3 pl-10 pr-24 text-sm transition",
                          "focus:outline-none focus:ring-4 focus:ring-white/10",
                          "placeholder:text-white/55"
                        )}
                        style={{
                          background: COLORS.inputBg,
                          border: `1px solid ${COLORS.inputBorder}`,
                          color: COLORS.headerText,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                        }}
                        placeholder="Search products..."
                        aria-label="Search products"
                      />

                      <div className="absolute inset-y-0 right-2 flex items-center">
                        <button
                          className="cursor-pointer inline-flex h-8 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-white shadow hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                          style={{ background: COLORS.cta }}
                          type="submit"
                        >
                          Search
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </form>

                    <SuggestionDropdown
                      open={showSuggest && search.trim().length >= 2}
                      loading={suggestLoading}
                      items={suggestions}
                      query={search.trim()}
                      onPick={handleSuggestionPick}
                      onSearchAll={() => submitSearch()}
                      anchor="desktop"
                    />
                  </div>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-1.5 lg:ml-3">
                <div className="hidden lg:flex">
                  <button
                    type="button"
                    onClick={() => go("/location")}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    style={{ color: COLORS.headerText }}
                  >
                    <MapPin className="h-4 w-4" style={{ color: COLORS.headerMuted }} /> Dhaka
                  </button>
                </div>

                <IconButton label="Cart" onClick={() => go("/cart")} tone="dark">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  {cartCount > 0 && <Badge>{cartCount}</Badge>}
                </IconButton>

                <div className="hidden sm:block">
                  {mergedIsAuthenticated ? (
                    <div ref={desktopUserMenuRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setDesktopUserMenuOpen((v) => !v)}
                        className="cursor-pointer inline-flex h-9 items-center gap-2 rounded-xl px-2.5 text-sm font-semibold transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                        style={{ color: COLORS.headerText }}
                        aria-expanded={desktopUserMenuOpen}
                        aria-haspopup="menu"
                      >
                        {profileImage ? (
                          <span className="h-7 w-7 overflow-hidden rounded-full ring-1 ring-white/20 shrink-0">
                            <img
                              src={profileImage}
                              alt={displayName}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </span>
                        ) : (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 shrink-0">
                            <User className="h-4 w-4" />
                          </span>
                        )}

                        <span className="max-w-[110px] truncate">{displayName}</span>
                        <ChevronDown className={cx("h-4 w-4 transition", desktopUserMenuOpen && "rotate-180")} />
                      </button>

                      {desktopUserMenuOpen ? (
                        <DesktopUserMenu
                          user={mergedUser}
                          onProfile={() => go("/profile")}
                          onLogout={handleLogout}
                        />
                      ) : null}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => go("/login")}
                      className="cursor-pointer inline-flex h-9 items-center gap-2 rounded-xl px-2.5 text-sm font-semibold transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      style={{ color: COLORS.headerText, background: "transparent" }}
                    >
                      <User className="h-4 w-4" />
                      <span>Login</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-2 lg:hidden">
              <div ref={mobileSearchRef} className="relative">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4" style={{ color: COLORS.headerMuted }} />
                  </div>

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => {
                      if (search.trim().length >= 2) setShowSuggest(true);
                    }}
                    className={cx(
                      "h-10 w-full rounded-2xl px-3 pl-10 pr-14 text-sm transition",
                      "focus:outline-none focus:ring-4 focus:ring-white/10",
                      "placeholder:text-white/55"
                    )}
                    style={{
                      background: COLORS.inputBg,
                      border: `1px solid ${COLORS.inputBorder}`,
                      color: COLORS.headerText,
                    }}
                    placeholder="Search products..."
                    aria-label="Search products"
                  />

                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <button
                      type="submit"
                      aria-label="Search"
                      className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-xl text-white shadow hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      style={{ background: COLORS.cta }}
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </form>

                <SuggestionDropdown
                  open={showSuggest && search.trim().length >= 2}
                  loading={suggestLoading}
                  items={suggestions}
                  query={search.trim()}
                  onPick={handleSuggestionPick}
                  onSearchAll={() => submitSearch()}
                  anchor="mobile"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          {isLoading ? (
            <div className="border-t border-black/10 bg-white">
              <div className="mx-auto max-w-screen-2xl px-6 sm:px-10 lg:px-12 xl:px-14 py-2 text-sm text-black/50">
                Loading categories...
              </div>
            </div>
          ) : error ? (
            <div className="border-t border-black/10 bg-white">
              <div className="mx-auto max-w-screen-2xl px-6 sm:px-10 lg:px-12 xl:px-14 py-2 text-sm text-red-600">
                Failed to load categories: {error}
              </div>
            </div>
          ) : (
            <CategoryBar items={desktopCategoryBar} />
          )}
        </div>

        <div className="lg:hidden">
          <MobileDrawer open={mobileOpen} onClose={closeMobileCategories} mobileGroups={mobileGroups} />
        </div>
      </header>

      <MobileBottomNav
        cartCount={cartCount}
        isCategoriesOpen={mobileOpen}
        onToggleCategories={toggleMobileCategories}
        onCloseCategories={closeMobileCategories}
        isAuthenticated={mergedIsAuthenticated}
        user={mergedUser}
      />
    </>
  );
}