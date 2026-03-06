import React, { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Navbar from "../Navbar/NavbarClient";
import Footer from "../Footer/Footer";

import TopRouteLoader from "../Utils/TopRouteLoader";
import DynamicBreadcrumb from "../Utils/DynamicBreadcrumb";

import { productsSeed } from "../Home/HomePageClient";

function Layout() {
  const { pathname } = useLocation();

  // ✅ admin route detection
  const isAdminRoute = useMemo(() => {
    return pathname === "/admin" || pathname.startsWith("/admin/");
  }, [pathname]);

  return (
    <div>
      {/* ✅ Global route loading bar */}
      <TopRouteLoader />

      {/* ✅ Hide Navbar on admin */}
      {!isAdminRoute && <Navbar />}

      {/* ✅ Hide Breadcrumb on admin */}
      {!isAdminRoute && (
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          <DynamicBreadcrumb
            labels={{
              brands: "Brands",
              categories: "Categories",
              product: "Product",
              deals: "Deals",
            }}
            resolveCrumb={({ segment, segments, index }) => {
              // /product/:productId -> show product title instead of id
              if (segments[index - 1] === "product") {
                const p = productsSeed.find((x) => x.id === segment);
                return p ? p.title : `Product ${segment}`;
              }
              return null;
            }}
          />
        </div>
      )}

      <Outlet />

      {/* ✅ (Optional) Hide Footer on admin too */}
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default Layout;
