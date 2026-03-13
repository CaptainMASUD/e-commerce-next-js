"use client";

import React, { useState } from "react";

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
import AdminCategoryCampaignsPage from "./CategoryCampain";
import AdminArrivalCampaignsPage from "./ArrivalCampaign";

export default function Dashboard() {
  const [active, setActive] = useState("dashboard");

  const handleLogout = () => {
    console.log("logout");
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex">
      <Sidebar
        active={active}
        setActive={setActive}
        onLogout={handleLogout}
        counts={{
          products: 0,
          brands: 0,
          mainCategories: 0,
          subCategories: 0,
          notifications: 0,
          orders: 0,
          cart: 0,
          users: 0,
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

          {active === "category-campaigns" && <AdminCategoryCampaignsPage />}
          {active === "arrival-campaigns" && <AdminArrivalCampaignsPage />}

          {active === "products" && <Products />}
        </div>
      </main>
    </div>
  );
}