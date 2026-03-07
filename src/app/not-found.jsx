import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-gray-800">
        Page not found
      </h2>
      <p className="mt-3 max-w-md text-gray-600">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>

      <div className="mt-6">
        <Link
          href="/"
          className="rounded-md bg-black px-5 py-3 text-white transition hover:opacity-90"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}