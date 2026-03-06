import Footer from "@/Components/Footer/Footer";
import NavbarServer from "@/Components/Navbar/NavbarServer";
import DynamicBreadcrumb from "@/Components/Utils/DynamicBreadcrumb";

export default function RootGroupLayout({ children }) {
  return (
    <>
      <NavbarServer />

      <div className="px-4 sm:px-6 lg:px-10">
        <DynamicBreadcrumb hiddenRoutes={["/", "/home"]} />
      </div>

      <main>{children}</main>

      <Footer />
    </>
  );
}