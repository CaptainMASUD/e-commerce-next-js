import { Suspense } from "react";
import Footer from "@/Components/Footer/Footer";
import NavbarServer from "@/Components/Navbar/NavbarServer";
import DynamicBreadcrumb from "@/Components/Utils/DynamicBreadcrumb";
import TopRouteLoaderClient from "@/Components/Utils/TopRouteLoaderClient";

export default function RootGroupLayout({ children }) {
  return (
    <>
      <Suspense fallback={null}>
        <TopRouteLoaderClient />
      </Suspense>

      <NavbarServer />

      <div className="px-4 sm:px-6 lg:px-10">
        <DynamicBreadcrumb hiddenRoutes={["/", "/home"]} />
      </div>

      <main>{children}</main>

      <Footer />
    </>
  );
}