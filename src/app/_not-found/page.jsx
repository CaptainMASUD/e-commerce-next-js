// app/not-found.jsx
import dynamic from "next/dynamic";
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div>Not found</div>
    </>
  );
}