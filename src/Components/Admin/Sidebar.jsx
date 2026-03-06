// Sidebar.jsx
"use client";

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutDashboard,
  FolderTree,
  Tags,
  BadgeCheck,
  Package,
  LogOut,
  User,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Search,
  Settings,
  LifeBuoy,
  Bell,
  PanelLeftOpen,
  PanelLeftClose,
  X,
  PlusSquare,
  ListChecks,
  ShoppingCart,
  ShoppingBag,
} from "lucide-react";

/**
 * CLEAN PREMIUM SIDEBAR (Refreshed Pro Theme)
 * ✅ Sectioned navigation: Overview / Inventory / Account
 * ✅ Search across all sections + highlight matches
 * ✅ Collapsed mode + tooltips
 * ✅ Mobile drawer: focus trap + scroll lock + ESC close + outside click
 * ✅ Persist collapsed + group open via localStorage
 * ✅ Accessible: aria-current / aria-expanded / focus rings
 *
 * ✅ UPDATE IN THIS VERSION:
 * - Products now has sub options:
 *   - All Products
 *   - Create Product
 * - Added:
 *   - Orders
 *   - Cart
 */

const THEME = {
  bg0: "#0B1220",
  bg1: "#070B14",

  surface: "rgba(255,255,255,0.035)",
  surface2: "rgba(255,255,255,0.055)",
  surface3: "rgba(255,255,255,0.085)",

  border: "rgba(255,255,255,0.10)",
  borderSoft: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",

  text: "rgba(255,255,255,0.94)",
  muted: "rgba(255,255,255,0.66)",
  dim: "rgba(255,255,255,0.48)",

  accent: "#6366F1",
  accent2: "#818CF8",

  danger: "#F43F5E",
  ok: "#22C55E",

  hoverBg: "rgba(255,255,255,0.06)",
  focusRing: "rgba(99,102,241,0.35)",

  toggleBlueA: "#6366F1",
  toggleBlueB: "#1D4ED8",
  toggleOrangeA: "#6366F1",
  toggleOrangeB: "#312E81",
};

const cx = (...a) => a.filter(Boolean).join(" ");
const storageKey = (k) => `clean_sidebar_v2:${k}`; // bumped version key

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const update = () => setReduced(!!mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

function useOnClickOutside(ref, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onDown = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) handler?.(e);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [ref, handler, enabled]);
}

function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return;
      setState(JSON.parse(raw));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [key, state]);

  return [state, setState];
}

function highlight(label, q) {
  if (!q?.trim()) return label;
  const query = q.trim().toLowerCase();
  const idx = label.toLowerCase().indexOf(query);
  if (idx < 0) return label;
  const a = label.slice(0, idx);
  const b = label.slice(idx, idx + query.length);
  const c = label.slice(idx + query.length);
  return (
    <span>
      {a}
      <mark
        style={{
          background: "rgba(99,102,241,0.18)",
          color: THEME.text,
          padding: "0 3px",
          borderRadius: 6,
          border: `1px solid rgba(99,102,241,0.26)`,
        }}
      >
        {b}
      </mark>
      {c}
    </span>
  );
}

export default function Sidebar({
  active,
  setActive,
  onLogout,
  onOpenNotifications,
  onOpenSettings,
  onOpenSupport,
  counts = {
    products: 0, // total products (optional)
    brands: 0,
    mainCategories: 0,
    subCategories: 0,
    notifications: 0,
    orders: 0, // ✅ added
    cart: 0, // ✅ added
  },
  user = {
    name: "Masudul Alam",
    email: "alam15-6072@s.diu.edu.bd",
    role: "Admin",
  },
  defaultCollapsed = false,
  onCollapsedChange,
  title = "Admin Panel",
  subtitle = "",
}) {
  const reduced = usePrefersReducedMotion();

  const isCatBrandsActive =
    active === "main-categories" || active === "sub-categories" || active === "brands";

  const isProductsActive =
    active === "products" || active === "products-all" || active === "products-create";

  const [collapsed, setCollapsed] = useLocalStorageState(
    storageKey("collapsed"),
    !!defaultCollapsed
  );

  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [groups, setGroups] = useLocalStorageState(storageKey("groups"), {
    "cat-brands": isCatBrandsActive,
    products: isProductsActive, // ✅ keep products group opened when active
  });

  useEffect(() => {
    if (isCatBrandsActive) setGroups((g) => ({ ...g, "cat-brands": true }));
    if (isProductsActive) setGroups((g) => ({ ...g, products: true }));
  }, [isCatBrandsActive, isProductsActive, setGroups]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((p) => {
      const next = !p;
      onCollapsedChange?.(next);
      return next;
    });
  }, [onCollapsedChange, setCollapsed]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((p) => !p), []);

  const handleNavClick = useCallback(
    (key) => {
      if (key.startsWith("__mini_")) return;
      setActive?.(key);
      closeMobile();
    },
    [setActive, closeMobile]
  );

  const toggleGroup = useCallback(
    (groupKey) => {
      if (collapsed) {
        setCollapsed(false);
        onCollapsedChange?.(false);
        requestAnimationFrame(() => {
          setGroups((g) => ({ ...g, [groupKey]: true }));
        });
        return;
      }
      setGroups((g) => ({ ...g, [groupKey]: !g[groupKey] }));
    },
    [collapsed, onCollapsedChange, setCollapsed, setGroups]
  );

  const onMiniAction = useCallback(
    (key) => {
      if (key === "__mini_notifications") {
        if (onOpenNotifications) onOpenNotifications();
        else alert("Notifications (wire me)");
      }
      if (key === "__mini_settings") {
        if (onOpenSettings) onOpenSettings();
        else alert("Settings (wire me)");
      }
      if (key === "__mini_support") {
        if (onOpenSupport) onOpenSupport();
        else alert("Support (wire me)");
      }
      closeMobile();
    },
    [onOpenNotifications, onOpenSettings, onOpenSupport, closeMobile]
  );

  // sections model
  const sections = useMemo(() => {
    const base = [
      {
        key: "sec-overview",
        title: "Overview",
        items: [{ key: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
      },
      {
        key: "sec-inventory",
        title: "Inventory",
        items: [
          {
            key: "cat-brands",
            label: "Categories & Brands",
            icon: FolderTree,
            children: [
              { key: "main-categories", label: "Main Categories", icon: Tags, badge: counts.mainCategories },
              { key: "sub-categories", label: "Sub Categories", icon: Tags, badge: counts.subCategories },
              { key: "brands", label: "Brands", icon: BadgeCheck, badge: counts.brands },
            ],
          },

          // ✅ Products is now a group with children
          {
            key: "products",
            label: "Products",
            icon: Package,
            children: [
              { key: "products-all", label: "All Products", icon: ListChecks, badge: counts.products },
              { key: "products-create", label: "Create Product", icon: PlusSquare },
            ],
          },

          // ✅ NEW: Orders + Cart
          { key: "orders", label: "Orders", icon: ShoppingBag, badge: counts.orders },
          { key: "cart", label: "Cart", icon: ShoppingCart, badge: counts.cart },
        ],
      },
      {
        key: "sec-account",
        title: "Account",
        items: [
          { key: "__mini_notifications", label: "Notifications", icon: Bell, kind: "mini", badge: counts.notifications },
          { key: "__mini_settings", label: "Settings", icon: Settings, kind: "mini" },
          { key: "__mini_support", label: "Support", icon: LifeBuoy, kind: "mini" },
        ],
      },
    ];

    if (!query.trim()) return base;

    const q = query.toLowerCase();
    const filtered = base
      .map((sec) => {
        const items = sec.items
          .map((it) => {
            if (it.kind === "mini") return it.label.toLowerCase().includes(q) ? it : null;

            if (!it.children) return it.label.toLowerCase().includes(q) ? it : null;

            const groupMatch = it.label.toLowerCase().includes(q);
            const kids = it.children.filter((c) => c.label.toLowerCase().includes(q));
            if (groupMatch) return it;
            if (kids.length) return { ...it, children: kids };
            return null;
          })
          .filter(Boolean);

        if (!items.length) return null;
        return { ...sec, items };
      })
      .filter(Boolean);

    return filtered;
  }, [query, counts]);

  // Mobile: lock body scroll
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // ESC closes mobile + focus trap
  const mobileRef = useRef(null);
  const mobileFirstFocusRef = useRef(null);
  const mobileLastFocusRef = useRef(null);

  useEffect(() => {
    if (!mobileOpen) return;

    setTimeout(() => mobileFirstFocusRef.current?.focus?.(), 0);

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMobile();
        return;
      }
      if (e.key !== "Tab") return;

      const first = mobileFirstFocusRef.current;
      const last = mobileLastFocusRef.current;
      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, closeMobile]);

  useOnClickOutside(mobileRef, closeMobile, mobileOpen);

  const mobileToggleBg = mobileOpen
    ? `linear-gradient(135deg, ${THEME.toggleOrangeA} 0%, ${THEME.toggleOrangeB} 100%)`
    : `linear-gradient(135deg, ${THEME.toggleBlueA} 0%, ${THEME.toggleBlueB} 100%)`;

  return (
    <>
      {/* MOBILE TOGGLER */}
      <button
        type="button"
        onClick={toggleMobile}
        className="md:hidden fixed z-[80] top-3 inline-flex items-center justify-center rounded-2xl border cursor-pointer transition active:translate-y-[1px]"
        style={{
          width: 46,
          height: 42,
          left: mobileOpen ? "auto" : 12,
          right: mobileOpen ? 12 : "auto",
          background: mobileToggleBg,
          borderColor: "rgba(255,255,255,0.18)",
          color: "#fff",
          boxShadow: "0 12px 26px rgba(0,0,0,0.45)",
          outline: "none",
        }}
        aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
        title={mobileOpen ? "Close sidebar" : "Open sidebar"}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 16,
            padding: 1,
            background: "linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08))",
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            opacity: 0.9,
          }}
        />
        {mobileOpen ? <ChevronsLeft className="w-5 h-5" /> : <ChevronsRight className="w-5 h-5" />}
      </button>

      {/* MOBILE BACKDROP */}
      <div
        className={cx(
          "md:hidden fixed inset-0 z-[60] transition-opacity duration-200",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{ background: "rgba(0,0,0,0.62)" }}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* DESKTOP SIDEBAR */}
      <aside
        className={cx(
          "hidden md:flex flex-col transition-[width] duration-200",
          collapsed ? "w-20" : "w-[304px]"
        )}
        style={{
          background: `linear-gradient(180deg, ${THEME.bg0} 0%, ${THEME.bg1} 100%)`,
          borderRight: `1px solid ${THEME.borderSoft}`,
          height: "100vh",
        }}
      >
        {/* HEADER */}
        <div className="relative px-4 pt-4 pb-3" style={{ borderBottom: `1px solid ${THEME.borderSoft}` }}>
          <div className={cx("flex", collapsed ? "flex-col items-center gap-3" : "items-start gap-3")}>
            <div className="relative shrink-0">
              <div
                className="w-11 h-11 rounded-2xl grid place-items-center border"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderColor: THEME.borderStrong,
                  color: "white",
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)",
                }}
                title={collapsed ? user?.name || "User" : undefined}
              >
                <User className="w-5 h-5" />
              </div>
              <span
                className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full border"
                style={{ background: THEME.ok, borderColor: "rgba(0,0,0,0.35)" }}
                title="Online"
              />
            </div>

            {collapsed && (
              <button
                type="button"
                onClick={toggleCollapsed}
                className="sb-focusable inline-flex items-center justify-center rounded-2xl border cursor-pointer transition hover:bg-white/5 active:translate-y-[1px]"
                style={{
                  width: 40,
                  height: 36,
                  borderColor: THEME.borderStrong,
                  color: THEME.text,
                  backgroundColor: "rgba(255,255,255,0.03)",
                  outline: "none",
                }}
                title="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px]" style={{ color: THEME.muted }}>
                      {title}
                    </p>

                    <p className="text-xs truncate mt-0.5" style={{ color: THEME.dim }}>
                      {user?.name || "User"} • {user?.role || "Admin"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={toggleCollapsed}
                    className="sb-focusable shrink-0 inline-flex items-center justify-center rounded-2xl border cursor-pointer transition hover:bg-white/5 active:translate-y-[1px]"
                    style={{
                      width: 40,
                      height: 36,
                      borderColor: THEME.borderStrong,
                      color: THEME.text,
                      backgroundColor: "rgba(255,255,255,0.03)",
                      outline: "none",
                    }}
                    title="Collapse sidebar"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-2 text-[11px] font-semibold px-2.5 py-1 rounded-full border select-none"
                    style={{
                      borderColor: "rgba(255,255,255,0.12)",
                      backgroundColor: "rgba(255,255,255,0.035)",
                      color: THEME.text,
                    }}
                    title="Role"
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: THEME.accent }} />
                    {user?.role || "Admin"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(900px 260px at 15% 0%, rgba(99,102,241,0.16), transparent 62%), radial-gradient(900px 260px at 120% 0%, rgba(255,255,255,0.04), transparent 60%)",
              opacity: 0.75,
            }}
          />
        </div>

        {/* SEARCH (desktop) */}
        {!collapsed && (
          <div className="px-4 pt-3">
            <div
              className="rounded-2xl border flex items-center gap-2 px-3"
              style={{
                height: 44,
                backgroundColor: "rgba(255,255,255,0.03)",
                borderColor: THEME.borderSoft,
              }}
            >
              <Search className="w-4 h-4" style={{ color: THEME.muted }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full bg-transparent outline-none text-sm"
                style={{ color: THEME.text }}
                aria-label="Search navigation"
              />
              {query?.trim() && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="sb-focusable inline-flex items-center justify-center rounded-xl border cursor-pointer"
                  style={{
                    width: 34,
                    height: 32,
                    borderColor: "rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.02)",
                    color: THEME.muted,
                    outline: "none",
                  }}
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* NAV */}
        <div className={cx("flex-1 overflow-auto sb-scroll", collapsed ? "px-2" : "px-4", "py-3")}>
          <nav className="space-y-4" aria-label="Sidebar navigation">
            {sections.map((sec) => (
              <div key={sec.key} className="space-y-1.5">
                {!collapsed && (
                  <div className="pt-1">
                    <p className="px-2 text-[11px] tracking-wide uppercase" style={{ color: THEME.dim }}>
                      {sec.title}
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  {sec.items.map((item) => {
                    if (item.kind === "mini") {
                      return (
                        <MiniAction
                          key={item.key}
                          label={item.label}
                          labelNode={highlight(item.label, query)}
                          icon={item.icon}
                          onClick={() => onMiniAction(item.key)}
                          badge={item.badge}
                          hotDot={item.key === "__mini_notifications" && (counts?.notifications || 0) > 0}
                        />
                      );
                    }

                    if (item.children) {
                      const open = !!groups[item.key];
                      const isActiveGroup = item.key === "cat-brands" ? isCatBrandsActive : isProductsActive;

                      return (
                        <div key={item.key} className="space-y-1.5">
                          <GroupButton
                            collapsed={collapsed}
                            label={item.label}
                            labelNode={highlight(item.label, query)}
                            icon={item.icon}
                            active={isActiveGroup}
                            open={open}
                            onClick={() => toggleGroup(item.key)}
                            reduced={reduced}
                          />

                          {!collapsed && (
                            <div
                              className="overflow-hidden"
                              style={{
                                transition: reduced ? "none" : "max-height 220ms ease, opacity 180ms ease",
                                maxHeight: open ? 340 : 0,
                                opacity: open ? 1 : 0,
                              }}
                            >
                              <div className="pl-4 pr-1 py-1 space-y-1">
                                {item.children.map((child) => (
                                  <SubItem
                                    key={child.key}
                                    label={child.label}
                                    labelNode={highlight(child.label, query)}
                                    icon={child.icon}
                                    active={active === child.key}
                                    onClick={() => handleNavClick(child.key)}
                                    reduced={reduced}
                                    badge={child.badge}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Item
                        key={item.key}
                        collapsed={collapsed}
                        label={item.label}
                        labelNode={highlight(item.label, query)}
                        icon={item.icon}
                        active={active === item.key}
                        onClick={() => handleNavClick(item.key)}
                        reduced={reduced}
                        badge={item.badge}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* FOOTER */}
        <div className={cx(collapsed ? "px-2" : "px-4", "pt-3 pb-4")} style={{ borderTop: `1px solid ${THEME.borderSoft}` }}>
          <button
            type="button"
            onClick={onLogout}
            className="sb-logout sb-focusable w-full inline-flex items-center justify-center gap-2 rounded-2xl font-semibold cursor-pointer transition"
            style={{
              height: 46,
              fontSize: 14,
              backgroundColor: "rgba(255,255,255,0.03)",
              border: `1px solid rgba(255,255,255,0.12)`,
              color: THEME.text,
              outline: "none",
            }}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && "Logout"}
          </button>

          <style>{`
            .sb-logout:hover{
              background:${THEME.danger} !important;
              border-color:${THEME.danger} !important;
              color:#fff !important;
            }
            .sb-logout:hover svg{ color:#fff !important; }
          `}</style>
        </div>

        {/* GLOBAL STYLES */}
        <style>{`
          .sb-scroll::-webkit-scrollbar{ width: 10px; }
          .sb-scroll::-webkit-scrollbar-thumb{
            background: rgba(255,255,255,0.08);
            border-radius: 999px;
            border: 3px solid transparent;
            background-clip: padding-box;
          }
          .sb-scroll::-webkit-scrollbar-thumb:hover{ background: rgba(255,255,255,0.12); }

          .sb-tooltip-wrap{ position: relative; }
          .sb-tooltip{
            position: absolute;
            left: 66px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(10,14,22,0.96);
            color: rgba(255,255,255,0.92);
            border: 1px solid rgba(255,255,255,0.12);
            padding: 8px 10px;
            font-size: 12px;
            border-radius: 12px;
            box-shadow: 0 14px 40px rgba(0,0,0,0.38);
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 140ms ease, transform 140ms ease;
          }
          .sb-tooltip:before{
            content:"";
            position:absolute;
            left:-6px;
            top: 50%;
            width: 10px;
            height: 10px;
            background: rgba(10,14,22,0.96);
            border-left: 1px solid rgba(255,255,255,0.12);
            border-bottom: 1px solid rgba(255,255,255,0.12);
            transform: translateY(-50%) rotate(45deg);
          }
          .sb-tooltip-wrap:hover .sb-tooltip{
            opacity: 1;
            transform: translateY(-50%) translateX(2px);
          }

          .sb-sheen{
            position:absolute;
            inset:0;
            pointer-events:none;
            opacity:0;
            transition: opacity 160ms ease;
            background: radial-gradient(520px 140px at 18% 0%, rgba(255,255,255,0.06), transparent 62%);
          }
          .sb-hover:hover .sb-sheen{ opacity:1; }

          .sb-focusable:focus-visible{
            outline: none !important;
            box-shadow: 0 0 0 3px ${THEME.focusRing};
          }
        `}</style>
      </aside>

      {/* MOBILE DRAWER */}
      <aside
        ref={mobileRef}
        className={cx(
          "md:hidden fixed top-0 left-0 z-[65] h-[100dvh] w-72 transition-transform duration-200 will-change-transform flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: `linear-gradient(180deg, ${THEME.bg0} 0%, ${THEME.bg1} 100%)`,
          borderRight: `1px solid ${THEME.borderSoft}`,
          boxShadow: "18px 0 55px rgba(0,0,0,0.45)",
          paddingTop: "env(safe-area-inset-top)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile sidebar"
      >
        {/* MOBILE HEADER */}
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${THEME.borderSoft}` }}>
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <div
                className="w-11 h-11 rounded-2xl grid place-items-center border"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderColor: THEME.borderStrong,
                  color: "white",
                }}
              >
                <User className="w-5 h-5" />
              </div>
              <span
                className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full border"
                style={{ background: THEME.ok, borderColor: "rgba(0,0,0,0.35)" }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px]" style={{ color: THEME.muted }}>
                Signed in
              </p>
              <p className="font-semibold leading-5 truncate" style={{ color: THEME.text }}>
                {user?.name || "User"}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: THEME.dim }}>
                {user?.email || ""}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-2 text-[11px] font-semibold px-2.5 py-1 rounded-full border select-none"
                  style={{
                    borderColor: "rgba(255,255,255,0.12)",
                    backgroundColor: "rgba(255,255,255,0.035)",
                    color: THEME.text,
                  }}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: THEME.accent }} />
                  {user?.role || "Admin"}
                </span>

                <button
                  ref={mobileFirstFocusRef}
                  type="button"
                  onClick={closeMobile}
                  className="sb-focusable ml-auto inline-flex items-center justify-center rounded-2xl border cursor-pointer"
                  style={{
                    width: 38,
                    height: 34,
                    borderColor: "rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.02)",
                    color: THEME.text,
                    outline: "none",
                  }}
                  aria-label="Close sidebar"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div
              className="rounded-2xl border flex items-center gap-2 px-3"
              style={{
                height: 44,
                backgroundColor: "rgba(255,255,255,0.03)",
                borderColor: THEME.borderSoft,
              }}
            >
              <Search className="w-4 h-4" style={{ color: THEME.muted }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full bg-transparent outline-none text-sm"
                style={{ color: THEME.text }}
                aria-label="Search navigation"
              />
              {query?.trim() && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="sb-focusable inline-flex items-center justify-center rounded-xl border cursor-pointer"
                  style={{
                    width: 34,
                    height: 32,
                    borderColor: "rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.02)",
                    color: THEME.muted,
                    outline: "none",
                  }}
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE NAV */}
        <div className="px-4 py-3 flex-1 overflow-auto sb-scroll">
          <nav className="space-y-4" aria-label="Mobile sidebar navigation">
            {sections.map((sec) => (
              <div key={sec.key} className="space-y-1.5">
                <div className="pt-1">
                  <p className="px-2 text-[11px] tracking-wide uppercase" style={{ color: THEME.dim }}>
                    {sec.title}
                  </p>
                </div>

                <div className="space-y-1.5">
                  {sec.items.map((item) => {
                    if (item.kind === "mini") {
                      return (
                        <MiniAction
                          key={item.key}
                          label={item.label}
                          labelNode={highlight(item.label, query)}
                          icon={item.icon}
                          onClick={() => onMiniAction(item.key)}
                          badge={item.badge}
                          hotDot={item.key === "__mini_notifications" && (counts?.notifications || 0) > 0}
                        />
                      );
                    }

                    if (item.children) {
                      const open = !!groups[item.key];
                      const isActiveGroup = item.key === "cat-brands" ? isCatBrandsActive : isProductsActive;

                      return (
                        <div key={item.key} className="space-y-1.5">
                          <GroupButton
                            collapsed={false}
                            label={item.label}
                            labelNode={highlight(item.label, query)}
                            icon={item.icon}
                            active={isActiveGroup}
                            open={open}
                            onClick={() => setGroups((g) => ({ ...g, [item.key]: !g[item.key] }))}
                            reduced={reduced}
                          />

                          <div
                            className="overflow-hidden"
                            style={{
                              transition: reduced ? "none" : "max-height 220ms ease, opacity 180ms ease",
                              maxHeight: open ? 340 : 0,
                              opacity: open ? 1 : 0,
                            }}
                          >
                            <div className="pl-4 pr-1 py-1 space-y-1">
                              {item.children.map((child) => (
                                <SubItem
                                  key={child.key}
                                  label={child.label}
                                  labelNode={highlight(child.label, query)}
                                  icon={child.icon}
                                  active={active === child.key}
                                  onClick={() => handleNavClick(child.key)}
                                  reduced={reduced}
                                  badge={child.badge}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Item
                        key={item.key}
                        collapsed={false}
                        label={item.label}
                        labelNode={highlight(item.label, query)}
                        icon={item.icon}
                        active={active === item.key}
                        onClick={() => handleNavClick(item.key)}
                        reduced={reduced}
                        badge={item.badge}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* MOBILE FOOTER */}
        <div className="px-4 pt-3 pb-4" style={{ borderTop: `1px solid ${THEME.borderSoft}` }}>
          <button
            ref={mobileLastFocusRef}
            type="button"
            onClick={() => {
              closeMobile();
              onLogout?.();
            }}
            className="sb-logout sb-focusable w-full inline-flex items-center justify-center gap-2 rounded-2xl font-semibold cursor-pointer transition"
            style={{
              height: 46,
              fontSize: 14,
              backgroundColor: "rgba(255,255,255,0.03)",
              border: `1px solid rgba(255,255,255,0.12)`,
              color: THEME.text,
              outline: "none",
            }}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

/* ---------- UI pieces ---------- */

function Item({ label, labelNode, icon: Icon, active, onClick, collapsed, reduced, badge }) {
  const content = labelNode || label;

  return (
    <div className={collapsed ? "sb-tooltip-wrap" : ""}>
      <button
        type="button"
        onClick={onClick}
        className="sb-hover sb-focusable w-full flex items-center font-semibold cursor-pointer"
        style={{
          height: 46,
          fontSize: 14,
          padding: collapsed ? "6px" : "8px 10px",
          gap: collapsed ? 0 : 10,
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 14,
          backgroundColor: active ? THEME.surface3 : "transparent",
          color: THEME.text,
          border: `1px solid ${active ? "rgba(255,255,255,0.14)" : "transparent"}`,
          transition: reduced ? "none" : "background-color 160ms ease, border-color 160ms ease",
          position: "relative",
          overflow: "hidden",
          outline: "none",
        }}
        title={collapsed ? label : undefined}
        aria-current={active ? "page" : undefined}
      >
        {!collapsed && <Rail show={active} reduced={reduced} />}
        <Icon className="w-[18px] h-[18px] shrink-0" style={{ color: "rgba(255,255,255,0.90)" }} />
        {!collapsed && <span className="truncate">{content}</span>}

        {!collapsed && (
          <span className="ml-auto flex items-center gap-2">
            {typeof badge === "number" && badge > 0 && <Badge value={badge} />}
            <Dot show={active} reduced={reduced} />
          </span>
        )}

        <span className="sb-sheen" aria-hidden="true" />
      </button>

      {collapsed && (
        <div className="sb-tooltip" role="tooltip">
          <div className="flex items-center gap-2">
            <span>{label}</span>
            {typeof badge === "number" && badge > 0 && <Badge value={badge} compact />}
          </div>
        </div>
      )}

      <style>{`
        .sb-hover:hover{
          background:${THEME.hoverBg};
          border-color:${THEME.borderSoft};
        }
      `}</style>
    </div>
  );
}

function GroupButton({ label, labelNode, icon: Icon, active, open, onClick, collapsed, reduced }) {
  const content = labelNode || label;

  return (
    <div className={collapsed ? "sb-tooltip-wrap" : ""}>
      <button
        type="button"
        onClick={onClick}
        className="sb-hover sb-focusable w-full flex items-center font-semibold cursor-pointer"
        style={{
          height: 46,
          fontSize: 14,
          padding: collapsed ? "6px" : "8px 10px",
          gap: collapsed ? 0 : 10,
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 14,
          backgroundColor: active ? THEME.surface3 : "transparent",
          color: THEME.text,
          border: `1px solid ${active ? "rgba(255,255,255,0.14)" : "transparent"}`,
          transition: reduced ? "none" : "background-color 160ms ease, border-color 160ms ease",
          position: "relative",
          overflow: "hidden",
          outline: "none",
        }}
        title={collapsed ? label : undefined}
        aria-expanded={!collapsed ? !!open : undefined}
      >
        {!collapsed && <Rail show={active} reduced={reduced} />}

        <Icon className="w-[18px] h-[18px] shrink-0" style={{ color: "rgba(255,255,255,0.90)" }} />

        {!collapsed && <span className="truncate">{content}</span>}

        {!collapsed && (
          <ChevronDown
            className="ml-auto w-4 h-4"
            style={{
              color: "rgba(255,255,255,0.72)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: reduced ? "none" : "transform 180ms ease",
            }}
          />
        )}

        <span className="sb-sheen" aria-hidden="true" />
      </button>

      {collapsed && (
        <div className="sb-tooltip" role="tooltip">
          {label}
        </div>
      )}

      <style>{`
        .sb-hover:hover{
          background:${THEME.hoverBg};
          border-color:${THEME.borderSoft};
        }
      `}</style>
    </div>
  );
}

function SubItem({ label, labelNode, icon: Icon, active, onClick, reduced, badge }) {
  const content = labelNode || label;

  return (
    <button
      type="button"
      onClick={onClick}
      className="sb-hover sb-focusable w-full flex items-center font-semibold cursor-pointer"
      style={{
        height: 40,
        fontSize: 13,
        padding: "8px 10px",
        gap: 10,
        justifyContent: "flex-start",
        borderRadius: 12,
        backgroundColor: active ? "rgba(255,255,255,0.06)" : "transparent",
        color: THEME.text,
        border: `1px solid ${active ? "rgba(255,255,255,0.12)" : "transparent"}`,
        transition: reduced ? "none" : "background-color 160ms ease, border-color 160ms ease",
        position: "relative",
        overflow: "hidden",
        outline: "none",
      }}
      title={label}
      aria-current={active ? "page" : undefined}
    >
      <Rail show={active} reduced={reduced} small />
      <Icon className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.84)" }} />
      <span className="truncate">{content}</span>

      <span className="ml-auto flex items-center gap-2">
        {typeof badge === "number" && badge > 0 && <Badge value={badge} />}
        <Dot show={active} reduced={reduced} />
      </span>

      <span className="sb-sheen" aria-hidden="true" />

      <style>{`
        .sb-hover:hover{
          background:${THEME.hoverBg};
          border-color:${THEME.borderSoft};
        }
      `}</style>
    </button>
  );
}

function MiniAction({ label, labelNode, icon: Icon, onClick, badge, hotDot = false }) {
  const content = labelNode || label;

  return (
    <button
      type="button"
      onClick={onClick}
      className="sb-hover sb-focusable w-full flex items-center cursor-pointer"
      style={{
        height: 40,
        fontSize: 13,
        padding: "8px 10px",
        gap: 10,
        justifyContent: "flex-start",
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.02)",
        color: THEME.muted,
        border: `1px solid ${THEME.borderSoft}`,
        position: "relative",
        overflow: "hidden",
        outline: "none",
      }}
      title={label}
    >
      <div className="relative">
        <Icon className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.72)" }} />
        {hotDot && (
          <span
            className="absolute -right-1 -top-1 w-2 h-2 rounded-full"
            style={{ background: THEME.accent, boxShadow: "0 0 0 2px rgba(10,14,22,0.9)" }}
          />
        )}
      </div>

      <span className="truncate">{content}</span>

      <span className="ml-auto flex items-center gap-2">
        {typeof badge === "number" && badge > 0 ? (
          <Badge value={badge} />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }} />
        )}
      </span>

      <span className="sb-sheen" aria-hidden="true" />

      <style>{`
        .sb-hover:hover{
          background:${THEME.hoverBg};
          border-color:${THEME.border};
          color:${THEME.text};
        }
      `}</style>
    </button>
  );
}

function Badge({ value, compact = false }) {
  const text = value > 99 ? "99+" : String(value);
  return (
    <span
      className="inline-flex items-center justify-center rounded-full border font-semibold"
      style={{
        minWidth: compact ? 34 : 36,
        height: compact ? 18 : 20,
        padding: "0 8px",
        fontSize: 11,
        color: THEME.text,
        borderColor: "rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.04)",
      }}
      title={`${value}`}
    >
      {text}
    </span>
  );
}

function Rail({ show, reduced, small = false }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 2,
        height: small ? 14 : 18,
        borderRadius: 999,
        background: THEME.accent,
        opacity: show ? 1 : 0,
        transition: reduced ? "none" : "opacity 160ms ease",
      }}
    />
  );
}

function Dot({ show, reduced }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full"
      style={{
        background: THEME.accent,
        opacity: show ? 1 : 0,
        transition: reduced ? "none" : "opacity 160ms ease",
      }}
    />
  );
}