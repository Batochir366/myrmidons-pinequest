"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { Camera } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Navigation } from "@/components/Navigation";
import Webcam from "react-webcam";
import { PYTHON_BACKEND_URL } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [teacherName, setTeacherName] = useState("");
  const [teacherNameError, setTeacherNameError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [src, setSrc] = useState("");
  const webcamRef = useRef<Webcam>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (teacherName.trim() === "") {
      setTeacherNameError("Багшийн нэр заавал бөглөх ёстой");
      return;
    }
    setTeacherNameError("");

    if (!webcamRef.current) {
      toast.error("Камер ажиллахгүй байна.");
      return;
    }

    setIsCapturing(true);
    setIsLoading(true);

    // Capture face
    const screenshot = webcamRef.current.getScreenshot();
    setSrc(screenshot!);
    if (!screenshot) {
      toast.error("Царай авахад алдаа гарлаа. Дахин оролдоно уу.");
      setIsCapturing(false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${PYTHON_BACKEND_URL}teacher/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherName, image_base64: screenshot }),
      });

      const contentType = response.headers.get("content-type");
      const rawText = await response.text();

      if (!contentType || !contentType.includes("application/json")) {
        toast.error("Сервертэй холбогдоход алдаа гарлаа");
      }

      const data = JSON.parse(rawText);

      if (response.ok) {
        toast.success("Амжилттай! Хуудас шилжиж байна...");
        localStorage.setItem("teacherName", teacherName);
        localStorage.setItem("teacherImage", screenshot);
        localStorage.setItem("teacherId", data.teacherId);

        router.push("/teacher");
      } else if (data.message === "Unknown face or no face found") {
        toast.error("Бүртгэлгүй царай эсвэл царай олдсонгүй");
      } else if (data.message === "Face does not match provided teacher name") {
        toast.error("Царай багшийн нэртэй тохирохгүй байна");
      } else {
        toast.error(data.message || "Нэвтрэхэд алдаа гарлаа");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Системийн алдаа гарлаа.");
    } finally {
      setIsCapturing(false);
      setIsLoading(false);
      setSrc("");
    }
  };

  return (
    <div className="min-h-screen bg-background justify-center">
      <Toaster position="top-right" />
      <Navigation />

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
        <div className="mx-auto flex w-screen flex-col justify-center space-y-6 sm:w-[400px] px-4">
          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl">Багш нэвтрэх</CardTitle>
              <CardDescription>
                Нэрээ оруулж, Нэвтрэх товч дарна уу. Автомат царай танилт
                хийгдэнэ.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="teacherName">Багшийн нэр</Label>
                  <Input
                    id="teacherName"
                    type="text"
                    placeholder="Бүтэн нэрээ оруулна уу"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className={teacherNameError ? "border-red-500" : ""}
                    disabled={isLoading || isCapturing}
                    required
                  />
                  {teacherNameError && (
                    <p className="text-sm text-red-500">{teacherNameError}</p>
                  )}
                </div>
                <div className="flex flex-col items-center  space-y-4 overflow-hidden rounded-full py-2">
                  {src !== "" && isCapturing ? (
                    <div className="relative w-60 h-60 flex items-center justify-center rounded-full">
                      {/* Captured face */}
                      <img
                        className="rounded-full w-55 h-55 object-cover blur-sm"
                        src={src}
                        alt="Captured"
                      />

                      {/* Spinner overlay */}
                      <div className="absolute w-60 h-60 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin rounded-full"></div>
                    </div>
                  ) : (
                    <div className="relative w-60 h-60">
                      <Webcam
                        screenshotQuality={1}
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "user" }}
                        className="w-full h-full rounded-full object-cover border-2 border-gray-300"
                      />

                      {/* SVG overlay */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 256 256"
                        className="absolute inset-0 w-full h-full pointer-events-none mt-2"
                      >
                        <path
                          style={{ stroke: "white" }}
                          fill="none"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="4 5"
                          transform="scale(1.2) translate(-25 -0.1)" // 🔹 makes it bigger & recenters
                          d="M72.2,95.9c0,5.5,4.1,9.9,9.1,9.9c0,0,0.1,0,0.2,0c1.9,26.2,22,52.4,46.5,52.4c24.5,0,44.6-26.2,46.5-52.4
c0,0,0.1,0,0.2,0c5,0,9.1-4.5,9.1-9.9c0-4.1-2.2-7.5-5.4-9.1c1.9-5.9,2.8-12.2,2.8-18.8C181.2,36,157.4,10,128,10
c-29.4,0-53.2,26-53.2,58.1c0,6.6,1,12.9,2.9,18.8C74.4,88.4,72.2,91.8,72.2,95.9z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    teacherName.trim() === "" || isLoading || isCapturing
                  }
                >
                  {isLoading || isCapturing ? (
                    <>Нэвтрэж байна...</>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      Нэвтрэх
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
