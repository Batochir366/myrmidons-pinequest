"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

export function Navigation() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <QrCode className="h-6 w-6 text-primary" />
          AttendanceTracker
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
