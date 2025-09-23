"use client";

import { useEffect, useRef, useState } from "react";
import type QRCodeStyling from "qr-code-styling";

interface QrProps {
  qrData: string;
  className?: string;
  logoSrc?: string;
  logoSize?: number;
  onQrReady?: (svg: string) => void; // QR SVG-г авах callback
}

export default function Qr({
  qrData,
  className,
  logoSrc = "/a.png",
  logoSize = 60,
  onQrReady,
}: QrProps) {
  const ref = useRef<HTMLDivElement>(null);
  const qrCode = useRef<QRCodeStyling | null>(null);
  const [containerSize, setContainerSize] = useState(400);

  // Container-ийн хэмжээ авах
  useEffect(() => {
    const updateSize = () => {
      if (ref.current?.parentElement) {
        setContainerSize(ref.current.parentElement.clientWidth);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // QR үүсгэх / шинэчлэх
  useEffect(() => {
    if (typeof window === "undefined") return;

    import("qr-code-styling").then(({ default: QRCodeStyling }) => {
      if (!qrCode.current) {
        qrCode.current = new QRCodeStyling({
          width: containerSize,
          height: containerSize,
          type: "svg",
          data: qrData,
          dotsOptions: { color: "#1a2b48", type: "rounded" },
          cornersSquareOptions: { color: "#1a2b48", type: "square" },
          cornersDotOptions: { color: "#fbbc05" },
          backgroundOptions: { color: "transparent" },
          qrOptions: { typeNumber: 0, mode: "Byte" },
        });
      } else {
        qrCode.current.update({
          data: qrData,
          width: containerSize,
          height: containerSize,
        });
      }

      if (ref.current) {
        ref.current.innerHTML = "";
        qrCode.current.append(ref.current);

        // SVG-г string болгон гаргах
        qrCode.current.getRawData("svg").then((value: any) => {
          if (!value) return;

          if (value instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
              onQrReady?.(reader.result as string);
            };
            reader.readAsText(value);
          } else if (value instanceof ArrayBuffer) {
            const svgString = new TextDecoder().decode(value);
            onQrReady?.(svgString);
          } else if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) {
            const arrayBuffer = value.buffer.slice(
              value.byteOffset,
              value.byteOffset + value.byteLength
            );
            const svgString = new TextDecoder().decode(arrayBuffer);
            onQrReady?.(svgString);
          }
        });
      }
    });
  }, [qrData, containerSize, onQrReady]);

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-xl flex items-center justify-center ${className}`}
    >
      <div ref={ref} />

      {/* Overlay логотой */}
      <div
        className="absolute rounded-full bg-white flex items-center justify-center overflow-hidden shadow-lg border-2 border-gray-200"
        style={{
          width: logoSize,
          height: logoSize,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <img
          src={logoSrc}
          alt="logo"
          style={{ width: logoSize * 0.7, height: logoSize * 0.7 }}
        />
      </div>
    </div>
  );
}
