import JoinClassPage from "@/components/JoinClass";
import React, { Suspense } from "react";

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="text-center p-10">Уншиж байна...</div>}>
      <JoinClassPage />
    </Suspense>
  );
}
