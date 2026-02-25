import React from "react";
import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { FiAlertTriangle, FiHome, FiRefreshCcw } from "react-icons/fi";

export default function AppErrorBoundary() {
  const error = useRouteError();

  let title = "Something went wrong";
  let message = "An unexpected error occurred. Please try again.";
  let status = null;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    title = status === 404 ? "Page not found" : `Error ${status}`;
    message = error.statusText || message;
  } else if (error instanceof Error) {
    message = error.message || message;
  }

  return (
    <div className="min-h-[70vh] w-full">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-100">
              <FiAlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            <div className="flex-1">
              <div className="text-xl font-black text-slate-900">
                {title}
                {status ? <span className="ml-2 text-sm font-bold text-slate-500">({status})</span> : null}
              </div>

              <p className="mt-1 text-sm font-semibold text-slate-600">{message}</p>

              <details className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-black/5">
                <summary className="cursor-pointer text-sm font-black text-slate-800">Technical details</summary>
                <pre className="mt-3 overflow-auto text-xs text-slate-700">
{String((error && (error.stack || error.message)) || error || "Unknown error")}
                </pre>
              </details>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
                >
                  <FiRefreshCcw className="h-4 w-4" />
                  Reload
                </button>

                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-900 hover:bg-slate-200"
                >
                  <FiHome className="h-4 w-4" />
                  Go Home
                </Link>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs font-semibold text-slate-500">
          Tip: If this happens after adding a new component, check import/export names.
        </p>
      </div>
    </div>
  );
}
