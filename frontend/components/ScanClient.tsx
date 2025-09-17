"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ScanClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const expiresAt = searchParams.get("expiresAt");

  const [status, setStatus] = useState("Validating QR code...");

  useEffect(() => {
    if (!token || !expiresAt) return;

    async function verify() {
      const res = await fetch(
        `https://myrmidons-pinequest-backend.vercel.app/scan?token=${token}&expiresAt=${expiresAt}`
      );
      const data = await res.json();

      if (data.ok) {
        setStatus("QR valid! Redirecting to face verification...");
        router.push(`/face-verify?token=${token}`);
      } else {
        setStatus(`QR error: ${data.message}`);
      }
    }

    verify();
  }, [token, expiresAt, router]);

  return <div>{status}</div>;
}
