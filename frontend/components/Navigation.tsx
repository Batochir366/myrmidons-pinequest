"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

export function Navigation() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex h-16 w-full justify-between items-center px-8">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl">
        <QrCode className="h-6 w-6 text-primary" />
        A+
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/login">
          <Button variant="ghost">Нэвтрэх</Button>
        </Link>
        <Link href="/signup">
          <Button>Бүртгүүлэх</Button>
        </Link>
      </div>
    </nav>
  );
}
