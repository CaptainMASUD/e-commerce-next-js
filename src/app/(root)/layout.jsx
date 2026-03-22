import { Suspense } from "react";
import Footer from "@/Components/Footer/Footer";
import NavbarServer from "@/Components/Navbar/NavbarServer";
import DynamicBreadcrumb from "@/Components/Utils/DynamicBreadcrumb";
import TopRouteLoaderClient from "@/Components/Utils/TopRouteLoaderClient";
import HelpWidget from "@/Components/chatbot/Chatbot";
import { CartProvider } from "@/Context/CartContext";

export const metadata = {
  title: {
    default: "Aura & OHM",
    template: "%s | Aura & OHM",
  },
  description:
    "Browse products, brands, and new arrivals at Aura & OHM.",
};

export default function RootGroupLayout({ children }) {
  return (
    <>
      <Suspense fallback={null}>
        <TopRouteLoaderClient />
      </Suspense>
      
      <CartProvider>
      <NavbarServer />

      <div className="px-4 sm:px-6 lg:px-10">
        <DynamicBreadcrumb
          hiddenRoutes={["/", "/home"]}
          hiddenSegments={["c"]}
        />
      </div>

      <main>{children}</main>
      <HelpWidget />
      <Footer />
    </CartProvider>

    </>
  );
}