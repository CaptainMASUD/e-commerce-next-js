// Dashboard.jsx
"use client";

import React, { useState } from "react";

import Overview from "./Overview";
import Sidebar from "./Sidebar";

import MainCategories from "./MainCategories";
import SubCategories from "./SubCategories";
import Brands from "./Brands";

import Products from "./Products"; // ✅ All products (existing)
import AdminProductCreateWizard from "./AdminProductCreateWizard"; // ✅ create component
import Orders from "./Orders";
import AdminCartsPage from "./Cart";


export default function Dashboard() {
  const [active, setActive] = useState("dashboard");

  const handleLogout = () => {
    console.log("logout");
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex">
      <Sidebar active={active} setActive={setActive} onLogout={handleLogout} />

      {/* ✅ RIGHT SIDE SCROLLS, NOT THE SIDEBAR */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="mx-auto p-4 md:p-6">
          {active === "dashboard" && <Overview />}

          {active === "main-categories" && <MainCategories />}
          {active === "sub-categories" && <SubCategories />}
          {active === "brands" && <Brands />}

          {/* ✅ Products group children */}
          {active === "products-all" && <Products />}

          {active === "products-create" && (
            <AdminProductCreateWizard
              isAdmin={true}
              onCreated={(payload) => {
                console.log("created payload:", payload);
                // optionally: setActive("products-all");
              }}
            />
          )}

          {/* ✅ NEW: Orders + Cart */}
          {active === "orders" && <Orders />}
          {active === "cart" && <AdminCartsPage />}

          {/* ✅ Backward compatibility if you still navigate to "products" somewhere */}
          {active === "products" && <Products />}
        </div>
      </main>
    </div>
  );
}