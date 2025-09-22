"use client";

import { useState } from "react";

export default function JoinLinkQrButton({
  joinLinkQr,
  showQr,
}: {
  joinLinkQr?: string | null;
  showQr: boolean;
}) {
  const [enlarged, setEnlarged] = useState(false);

  return (
    <div className="relative w-full flex flex-col items-center gap-4">
      {/* QR Image */}
      {showQr && joinLinkQr && (
        <div className="">
          <img
            src={joinLinkQr}
            alt="Join Link QR Code"
            className="w-50 h-50 rounded-xl border cursor-pointer transition-transform hover:scale-105"
            onClick={() => setEnlarged(true)}
          />
        </div>
      )}

      {/* Enlarged QR Modal */}
      {enlarged && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setEnlarged(false)}
        >
          <img
            src={joinLinkQr || ""}
            alt="Enlarged QR Code"
            className="w-[500px] h-[500px] rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
