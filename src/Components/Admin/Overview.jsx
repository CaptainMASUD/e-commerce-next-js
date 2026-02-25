"use client";

import React from "react";

export default function Overview() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard title="Products" value="1,248" />
      <StatCard title="Brands" value="86" />
      <StatCard title="Categories" value="24" />
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5">
      <p className="text-xs text-slate-500 font-semibold">{title}</p>
      <p className="text-2xl font-semibold mt-2 text-slate-900">{value}</p>
    </div>
  );
}
