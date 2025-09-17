import ScanClient from "@/components/ScanClient";
import React, { Suspense } from "react";

export default function ScanPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScanClient />
    </Suspense>
  );
}
