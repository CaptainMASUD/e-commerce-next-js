import Navbar from "@/Components/Navbar/Navbar";
import Footer from "@/Components/Footer/Footer";
import DynamicBreadcrumb from "@/Components/Utils/DynamicBreadcrumb";

export default function RootGroupLayout({ children }) {
  return (
    <>
      <Navbar />

      <div className="px-4 sm:px-6 lg:px-10">
        <DynamicBreadcrumb hiddenRoutes={["/", "/home"]} />
      </div>

      <main>{children}</main>

      <Footer />
    </>
  );
}