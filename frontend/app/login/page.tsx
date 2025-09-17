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
import { QrCode } from "lucide-react";
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

  const webcamRef = useRef<Webcam>(null);

  const capture = () => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot();
      if (screenshot) {
        setImageBase64(screenshot);
        setSubmissionMessage("Face captured and ready.");
        setSubmissionSuccess(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (teacherName.trim() === "") {
      setTeacherNameError("Teacher name is required");
      return;
    }
    setTeacherNameError("");

    if (!imageBase64) {
      setSubmissionMessage("Please capture your face image before submitting.");
      setSubmissionSuccess(false);
      return;
    }

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
        setSubmissionMessage(data.message || "Login successful!");
        localStorage.setItem("teacherName", teacherName);
        localStorage.setItem("teacherImage", imageBase64);

        setTimeout(() => {
          router.push("/teacher");
        }, 2000);
      } else {
        setSubmissionSuccess(false);
        setSubmissionMessage(data.message || "Login failed.");
      }
    } catch (error: any) {
      setSubmissionSuccess(false);
      setSubmissionMessage(
        "Login failed: " + (error.message || "Unknown error")
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <QrCode className="mx-auto h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Teacher Login
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your name and capture your face to sign in
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-xl">Sign in</CardTitle>
              <CardDescription>
                Please enter your name and take a photo for verification
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="teacherName">Teacher Name</Label>
                  <Input
                    id="teacherName"
                    type="text"
                    placeholder="Enter your full name"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className={teacherNameError ? "border-red-500" : ""}
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

                  <Button type="button" onClick={capture} variant="secondary">
                    Capture Face Image
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
                  disabled={!imageBase64 || teacherName.trim() === ""}
                >
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
