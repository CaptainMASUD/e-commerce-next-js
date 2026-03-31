"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import Overview from "./Overview";
import Sidebar from "./Sidebar";

import MainCategories from "./MainCategories";
import SubCategories from "./SubCategories";
import Brands from "./Brands";

import Products from "./Products";
import AdminProductCreateWizard from "./AdminProductCreateWizard";
import AdminEditProductPage from "./EditProductOverlay";
import Orders from "./Orders";
import AdminCartsPage from "./Cart";
import UsersPage from "./Users";
import Sales from "./Sales";
import CustomerCommentsPage from "./Customer";
import AdminCategoryCampaignsPage from "./CategoryCampain";
import AdminArrivalCampaignsPage from "./ArrivalCampaign";

function safeParseUser(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function getStoredAuth() {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }

  const getFirst = (storage, keys) => {
    for (const key of keys) {
      try {
        const value = storage.getItem(key);
        if (value) return value;
      } catch {}
    }
    return null;
  };

  const token =
    getFirst(localStorage, ["token", "accessToken", "adminToken"]) ||
    getFirst(sessionStorage, ["token", "accessToken", "adminToken"]);

  const rawUser =
    getFirst(localStorage, ["auth_user", "user", "adminUser", "authUser"]) ||
    getFirst(sessionStorage, ["auth_user", "user", "adminUser", "authUser"]);

  const user = safeParseUser(rawUser);

  return { token, user };
}

function clearStoredAuth() {
  if (typeof window === "undefined") return;

  const keys = [
    "token",
    "accessToken",
    "adminToken",
    "auth_user",
    "user",
    "adminUser",
    "authUser",
  ];

  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {}
    try {
      sessionStorage.removeItem(key);
    } catch {}
  }
}

const SUPER_ADMIN_ONLY_KEYS = ["category-campaigns", "arrival-campaigns"];

export default function Dashboard() {
  const router = useRouter();
  const [active, setActive] = useState("dashboard");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authUser, setAuthUser] = useState(null);

  const verifyAuth = useCallback(() => {
    const { token, user } = getStoredAuth();

    if (!token || !user) {
      clearStoredAuth();
      router.replace("/login");
      return false;
    }

    setAuthUser(user);
    return true;
  }, [router]);

  useEffect(() => {
    const ok = verifyAuth();
    setIsCheckingAuth(false);

    if (!ok) return;

    const onStorageChange = () => {
      verifyAuth();
    };

    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, [verifyAuth]);

  const handleLogout = useCallback(() => {
    clearStoredAuth();
    setAuthUser(null);
    router.replace("/login");
  }, [router]);

  const sidebarUser = useMemo(() => {
    if (!authUser) return null;

    return {
      name: authUser.name || authUser.fullName || authUser.username || "Admin",
      email: authUser.email || "",
      role: authUser.role || "admin",
    };
  }, [authUser]);

  const isSuperAdmin = sidebarUser?.role === "super_admin";

  useEffect(() => {
    if (!isCheckingAuth && !isSuperAdmin && SUPER_ADMIN_ONLY_KEYS.includes(active)) {
      setActive("dashboard");
    }
  }, [active, isCheckingAuth, isSuperAdmin]);

  const handleSetActive = useCallback(
    (next) => {
      if (!isSuperAdmin && SUPER_ADMIN_ONLY_KEYS.includes(next)) {
        setActive("dashboard");
        return;
      }
      setActive(next);
    },
    [isSuperAdmin]
  );

  if (isCheckingAuth) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex">
      <Sidebar
        active={active}
        setActive={handleSetActive}
        onLogout={handleLogout}
        user={sidebarUser}
        counts={{
          products: 0,
          brands: 0,
          mainCategories: 0,
          subCategories: 0,
          notifications: 0,
          orders: 0,
          cart: 0,
          users: 0,
          sales: 0,
          customerComments: 0,
          categoryCampaigns: 0,
          arrivalCampaigns: 0,
        }}
      />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="mx-auto p-4 md:p-6">
          {active === "dashboard" && <Overview />}

          {active === "main-categories" && <MainCategories />}
          {active === "sub-categories" && <SubCategories />}
          {active === "brands" && <Brands />}

          {active === "products-all" && <Products />}

          {active === "products-create" && (
            <AdminProductCreateWizard
              isAdmin={true}
              onCreated={(payload) => {
                console.log("created payload:", payload);
              }}
            />
          )}

          {active === "products-edit" && <AdminEditProductPage />}

          {active === "orders" && <Orders />}
          {active === "cart" && <AdminCartsPage />}
          {active === "users" && <UsersPage />}
          {active === "sales" && <Sales />}
          {active === "customer-comments" && <CustomerCommentsPage />}

          {isSuperAdmin && active === "category-campaigns" && <AdminCategoryCampaignsPage />}
          {isSuperAdmin && active === "arrival-campaigns" && <AdminArrivalCampaignsPage />}

          {active === "products" && <Products />}
        </div>
      </main>
    </div>
  );
}