import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

function Fallback() {
  return <div className="p-10">Loading...</div>;
}

export default async function VerifyEmailPage({ searchParams }) {
  const params = await searchParams;
  const token = params?.token ?? "";

  return (
    <Suspense fallback={<Fallback />}>
      <VerifyEmailClient token={token} />
    </Suspense>
  );
}