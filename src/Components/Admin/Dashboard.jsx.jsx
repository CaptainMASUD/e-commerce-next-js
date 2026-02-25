"use client";

import React, { useState } from "react";

import Overview from "./Overview";
import Products from "./Products";
import Sidebar from "./Sidebar";

import MainCategories from "./MainCategories";
import SubCategories from "./SubCategories";
import Brands from "./Brands";

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

          {active === "products" && <Products />}
        </div>
      </main>
    </div>
  );
}