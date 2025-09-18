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
import { Loader2 } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import Webcam from "react-webcam";

export default function LoginPage() {
  const router = useRouter();

  const [teacherName, setTeacherName] = useState("");
  const [teacherNameError, setTeacherNameError] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null
  );
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const webcamRef = useRef<Webcam>(null);

  const capture = () => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot();
      if (screenshot) {
        setImageBase64(screenshot);
        setSubmissionMessage("Царай амжилттай авагдлаа.");
        setSubmissionSuccess(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (teacherName.trim() === "") {
      setTeacherNameError("Багшийн нэр заавал бөглөх ёстой");
      return;
    }
    setTeacherNameError("");

    if (!imageBase64) {
      setSubmissionMessage("Нэвтрэхээсээ өмнө царайн зураг авна уу.");
      setSubmissionSuccess(false);
      return;
    }

    setIsLoading(true);
    setSubmissionMessage("Баталгаажуулж байна...");
    setSubmissionSuccess(null);

    const payload = {
      teacherName,
      image_base64: imageBase64,
    };

    try {
      const response = await fetch(
        "https://myrmidons-pinequest-production.up.railway.app/teacher/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSubmissionSuccess(true);
        setSubmissionMessage(data.message || "Амжилттай нэвтэрлээ!");
        localStorage.setItem("teacherName", teacherName);
        localStorage.setItem("teacherImage", imageBase64);
        localStorage.setItem("teacherId", data.teacherId);

        setTimeout(() => {
          router.push("/teacher");
        }, 2000);
      } else {
        setSubmissionSuccess(false);
        setSubmissionMessage(data.message || "Нэвтрэхэд алдаа гарлаа.");
      }
    } catch (error: any) {
      setSubmissionSuccess(false);
      setSubmissionMessage(
        "Нэвтрэхэд алдаа гарлаа: " + (error.message || "Тодорхойгүй алдаа")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background justify-center">
      <Navigation />

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
        <div className="mx-auto flex w-screen flex-col justify-center space-y-6 sm:w-[400px]">
          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-xl">Багш Нэвтрэх</CardTitle>
              <CardDescription>
                Баталгаажуулахын тулд нэрээ оруулж өөрийнхөө царайг таниулна уу.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="teacherName">Багшийн нэр</Label>
                  <Input
                    id="teacherName"
                    type="text"
                    placeholder="Бүтэн нэрээ оруулна уу"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className={teacherNameError ? "border-red-500" : ""}
                    disabled={isLoading}
                    required
                  />
                  {teacherNameError && (
                    <p className="text-sm text-red-500">{teacherNameError}</p>
                  )}
                </div>

                <div className="flex flex-col items-center space-y-4">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "user" }}
                    style={{
                      width: 240,
                      height: 240,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #ccc",
                    }}
                  />

                  <Button
                    type="button"
                    onClick={capture}
                    variant="secondary"
                    disabled={isLoading}
                  >
                    Царай таниулах
                  </Button>
                </div>

                {submissionMessage && (
                  <p
                    className={`text-sm ${
                      submissionSuccess === false
                        ? "text-red-500"
                        : submissionSuccess === true
                        ? "text-green-600"
                        : "text-gray-800"
                    }`}
                  >
                    {submissionMessage}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    !imageBase64 || teacherName.trim() === "" || isLoading
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Баталгаажуулж байна...
                    </>
                  ) : (
                    "Нэвтрэх"
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
