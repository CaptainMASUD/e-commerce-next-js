"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function NotFoundAnimation() {
  return (
    <div className="mx-auto w-full max-w-[220px] sm:max-w-[260px]">
      <DotLottieReact
        src="/animations/cat-404.lottie"
        loop
        autoplay
        className="h-full w-full"
      />
    </div>
  );
}