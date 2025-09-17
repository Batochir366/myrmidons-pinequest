import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ScanPage() {
  const router = useRouter();
  const { token, expiresAt } = router.query;
  const [status, setStatus] = useState("Validating QR code...");

  useEffect(() => {
    if (!token || !expiresAt) return;

    async function verify() {
      const res = await fetch(
        `/api/scanQR?token=${token}&expiresAt=${expiresAt}`
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
  }, [token, expiresAt]);

  return <div>{status}</div>;
}
