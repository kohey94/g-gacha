"use client";

import { useState } from "react";

type SpotVisualProps = {
  imageUrl?: string;
  name: string;
};

export function SpotVisual({ imageUrl, name }: SpotVisualProps) {
  const [failed, setFailed] = useState(false);

  if (imageUrl && !failed) {
    return (
      <div className="relative h-full min-h-64 overflow-hidden bg-[#dce5dc] lg:min-h-full">
        <img
          src={imageUrl}
          alt={`${name}の写真`}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-5 pb-4 pt-12 text-xs text-white/90">
          外部データ提供元の画像
        </div>
      </div>
    );
  }

  return (
    <div
      className="placeholder-landscape relative flex h-full min-h-64 items-end overflow-hidden px-6 pb-5 lg:min-h-full"
      role="img"
      aria-label={`${name}の写真はありません`}
    >
      <div className="placeholder-sun" />
      <svg
        className="absolute inset-x-0 bottom-0 h-[72%] w-full"
        viewBox="0 0 600 320"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 210 112 93l80 84 82-119 101 128 70-72 155 122v84H0Z" fill="#3d655e" opacity=".34" />
        <path d="m0 246 96-74 78 51 92-82 98 86 82-51 154 89v55H0Z" fill="#234b46" opacity=".78" />
        <path d="M0 278c106-29 181-21 276 7 103 29 206 11 324-14v49H0Z" fill="#173c39" />
      </svg>
      <span className="relative z-10 rounded-full border border-white/25 bg-[#173c39]/65 px-3 py-1.5 text-[11px] font-medium tracking-[0.13em] text-white backdrop-blur-sm">
        PHOTO NOT AVAILABLE
      </span>
    </div>
  );
}
