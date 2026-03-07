import Link from "next/link";
import NotFoundAnimation from "@/Components/NotFound/NotFoundAnimation";

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f5f0]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(248,245,240,0.92),_rgba(241,232,220,0.95))]" />
      <div className="absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-[#f6c89f]/25 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[220px] w-[220px] rounded-full bg-[#d8b4a0]/20 blur-3xl" />
      <div className="absolute bottom-10 left-10 h-[180px] w-[180px] rounded-full bg-[#f3dfc1]/25 blur-3xl" />

      <section className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-14 sm:px-10">
        <div className="w-full max-w-2xl text-center">
          <span className="inline-flex rounded-full border border-[#e8dccd] bg-white/80 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.28em] text-[#8b6b4a]">
            Aura &amp; OHM
          </span>

          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-[#1f1a17] sm:text-6xl">
            404
          </h1>

          <h2 className="mt-3 text-2xl font-medium text-[#2c241e] sm:text-3xl">
            This page could not be found
          </h2>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#6b5a4d] sm:text-base">
            The page you are looking for may have been moved, deleted, or the
            link might be incorrect.
          </p>

          <div className="mt-8">
            <NotFoundAnimation />
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#1f3b73] via-[#ff7e69] to-[#eab308] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(255,126,105,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(255,126,105,0.34)]"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}