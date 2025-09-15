"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

export default function QrGenerator() {
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [running, setRunning] = useState(false);

  const timerRef = useRef<NodeJS.Timer | null>(null);

  const generateQr = () => {
    const token = uuidv4();
    const expiresAt = Date.now() + 5000;
    const url = `https://myrmidons-pinequest-of9n.vercel.app/scan?token=${token}&expiresAt=${expiresAt}`;
    setQrData(url);

    QRCode.toDataURL(url, { width: 256 }, (err, dataUrl) => {
      if (err) {
        console.error("Error generating QR code:", err);
      } else {
        setQrImage(dataUrl);
      }
    });
  };

  const start = () => {
    if (running) return;
    generateQr();
    setCountdown(5);
    setRunning(true);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          generateQr();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current as any);
      timerRef.current = null;
    }
    setRunning(false);
    setQrData(null); // QR код устгах
    setQrImage(null); // Зураг устгах
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current as any);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h3 className="text-xl text-black font-semibold mb-4">
        Автомат QR код{" "}
        {running ? `(шинэчлэгдэхэд ${countdown} сек үлдлээ)` : "(Стоп хийсэн)"}
      </h3>

      {running && qrData && qrImage && (
        <div className="flex flex-col items-center mb-6">
          <img
            src={qrImage}
            alt="QR Code"
            className="w-64 h-64 rounded-lg shadow-lg mb-4"
          />
          <div className="text-xs text-gray-600 break-all max-w-xs bg-white p-2 rounded shadow">
            <a
              href={qrData}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {qrData}
            </a>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={start}
          className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
        >
          Start
        </button>
        <button
          onClick={stop}
          className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
        >
          Stop
        </button>
      </div>
    </div>
  );
}
