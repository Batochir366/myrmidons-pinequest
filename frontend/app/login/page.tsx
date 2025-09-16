"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode } from "lucide-react";
import { Navigation } from "@/components/Navigation";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    teacherId: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", formData);
  };

  return (
    <div className="min-h-screen bg-background justify-center">
      <Navigation />

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Тавтай морилно уу
            </h1>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Багш нэвтрэх</CardTitle>
              <CardDescription>Багшийн нэрээ оруулна уу</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teacherId">Багшийн нэр</Label>
                  <Input
                    id="teacherId"
                    type="text"
                    placeholder="Солонго"
                    value={formData.teacherId}
                    onChange={(e) =>
                      setFormData({ ...formData, teacherId: e.target.value })
                    }
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Нэвтрэх
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
