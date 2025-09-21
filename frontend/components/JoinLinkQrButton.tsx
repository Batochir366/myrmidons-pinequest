import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export default function JoinLinkQrButton({
  joinLinkQr,
}: {
  joinLinkQr?: string | null;
}) {
  const [showQr, setShowQr] = useState(false);
  const [enlarged, setEnlarged] = useState(false);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* QR Button */}
      <Button
        onClick={() => setShowQr(!showQr)}
        className="bg-slate-700 text-white gap-2 shadow-md"
      >
        {showQr ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        {showQr ? "QR нуух" : "QR харуулах"}
      </Button>

      {/* QR Image */}
      {showQr && joinLinkQr && (
        <div className="mt-4">
          <img
            src={joinLinkQr}
            alt="Join Link QR Code"
            className="w-50 h-50 rounded-xl border shadow-md cursor-pointer transition-transform hover:scale-105"
            onClick={() => setEnlarged(true)} // click -> томруулах
          />
        </div>
      )}

      {/* Enlarged QR Modal */}
      {enlarged && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setEnlarged(false)} // click -> хаах
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
