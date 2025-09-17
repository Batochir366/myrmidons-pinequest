"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
import { QrCode, GraduationCap, User, Camera, Eye } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import Webcam from "react-webcam";

export default function SignupPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<"teacher" | "student" | null>(null);
  const [studentStep, setStudentStep] = useState<"details" | "face">("details");
  const [teacherData, setTeacherData] = useState({
    email: "",
    teacherName: "",
  });
  const [studentData, setStudentData] = useState({
    studentName: "",
    studentId: "",
  });
  const [recognitionProgress, setRecognitionProgress] = useState(0);
  const [isRecognitionComplete, setIsRecognitionComplete] = useState(false);
  const [teacherErrors, setTeacherErrors] = useState({
    email: "",
    teacherName: "",
  });
  const [studentErrors, setStudentErrors] = useState({
    studentName: "",
    studentId: "",
  });
  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = {
      email: teacherData.email.trim() === "" ? "Email is required" : "",
      teacherName:
        teacherData.teacherName.trim() === "" ? "Name is required" : "",
    };

    setTeacherErrors(errors);

    if (errors.email || errors.teacherName) return;

    console.log("Teacher signup attempt:", teacherData);
    router.push("/");
  };

  const handleStudentDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = {
      studentName:
        studentData.studentName.trim() === "" ? "Student name is required" : "",
      studentId:
        studentData.studentId.trim() === "" ? "Student ID is required" : "",
    };

    setStudentErrors(errors);

    if (errors.studentName || errors.studentId) return;

    console.log("Student details:", studentData);
    setStudentStep("face");
  };

  const startFaceRecognition = () => {
    setRecognitionProgress(0);
    setIsRecognitionComplete(false);

    const interval = setInterval(() => {
      setRecognitionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRecognitionComplete(true);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };
  const webcamRef = useRef<Webcam>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null
  );
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean | null>(
    null
  );

  const capture = () => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot();
      if (screenshot) {
        setImageBase64(screenshot);
        setSubmissionMessage("Face captured and ready.");
      }
    }
  };

  const handleStudentComplete = async () => {
    if (!studentData.studentName || !studentData.studentId || !imageBase64) {
      setSubmissionSuccess(false);
      setSubmissionMessage("Please provide all details and capture an image.");
      return;
    }

    const payload = {
      name: studentData.studentName,
      studentId: studentData.studentId,
      image_base64: imageBase64,
    };

    try {
      const response = await fetch(
        "https://myrmidons-pinequest-production.up.railway.app/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSubmissionSuccess(true);
        setSubmissionMessage(data.message || "Signup successful!");

        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setSubmissionSuccess(false);
        setSubmissionMessage(data.message || "Signup failed.");
      }
    } catch (error: any) {
      setSubmissionSuccess(false);
      setSubmissionMessage(
        "Signup failed: " + (error.message || "Unknown error")
      );
    }
  };
  useEffect(() => {
    if (studentStep === "face") {
      startFaceRecognition();
    }
  }, [studentStep]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <QrCode className="mx-auto h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Create your account
            </h1>
          </div>

          {!userType && (
            <Card>
              <CardHeader className="space-y-4 text-center">
                <CardTitle className="text-xl">Choose Account Type</CardTitle>
                <CardDescription>
                  Select whether you're a teacher or student
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setUserType("teacher")}
                  variant="outline"
                  className="w-full h-16 flex items-center justify-center space-x-3"
                >
                  <div className="flex justify-center items-center gap-3">
                    <GraduationCap className="h-6 w-6 ml-2" />
                    <div className="font-medium">Teacher</div>
                  </div>
                </Button>

                <Button
                  onClick={() => setUserType("student")}
                  variant="outline"
                  className="w-full h-16 flex items-center justify-center space-x-3"
                >
                  <div className="flex justify-center items-center gap-3">
                    <User className="h-6 w-6 ml-2" />
                    <div className="font-medium">Student</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          )}

          {userType === "teacher" && (
            <Card>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl">Teacher Sign up</CardTitle>
                <CardDescription>
                  Create your account to generate QR codes for student
                  attendance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTeacherSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={teacherData.email}
                      onChange={(e) =>
                        setTeacherData({
                          ...teacherData,
                          email: e.target.value,
                        })
                      }
                      className={teacherErrors.email ? "border-red-500" : ""}
                    />
                    {teacherErrors.email && (
                      <p className="text-sm text-red-500">
                        {teacherErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teacherName">Teacher Name</Label>
                    <Input
                      id="teacherName"
                      type="text"
                      placeholder="Enter your full name"
                      value={teacherData.teacherName}
                      onChange={(e) =>
                        setTeacherData({
                          ...teacherData,
                          teacherName: e.target.value,
                        })
                      }
                      className={
                        teacherErrors.teacherName ? "border-red-500" : ""
                      }
                    />
                    {teacherErrors.teacherName && (
                      <p className="text-sm text-red-500">
                        {teacherErrors.teacherName}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full">
                    Create Teacher Account
                  </Button>
                </form>

                <div className="mt-4 text-center text-sm">
                  <Button
                    variant="ghost"
                    onClick={() => setUserType(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ← Back to account type
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {userType === "student" && studentStep === "details" && (
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">Student Registration</CardTitle>
                <CardDescription>Step 1: Enter your details</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleStudentDetailsSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Student Name</Label>
                    <Input
                      id="studentName"
                      type="text"
                      placeholder="Enter your full name"
                      value={studentData.studentName}
                      onChange={(e) =>
                        setStudentData({
                          ...studentData,
                          studentName: e.target.value,
                        })
                      }
                      className={
                        studentErrors.studentName ? "border-red-500" : ""
                      }
                    />
                    {studentErrors.studentName && (
                      <p className="text-sm text-red-500">
                        {studentErrors.studentName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      type="text"
                      placeholder="Enter your student ID"
                      value={studentData.studentId}
                      onChange={(e) =>
                        setStudentData({
                          ...studentData,
                          studentId: e.target.value,
                        })
                      }
                      className={
                        studentErrors.studentId ? "border-red-500" : ""
                      }
                    />
                    {studentErrors.studentId && (
                      <p className="text-sm text-red-500">
                        {studentErrors.studentId}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full">
                    Next: Face Registration
                  </Button>
                </form>

                <div className="mt-4 text-center text-sm">
                  <Button
                    variant="ghost"
                    onClick={() => setUserType(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ← Back to account type
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {userType === "student" && studentStep === "face" && (
            <Card>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl">Face Registration</CardTitle>
                <CardDescription>
                  Step 2: Align your face and capture an image
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                      margin: "auto",
                    }}
                  />

                  <Button
                    className="mt-4"
                    onClick={capture}
                    variant="secondary"
                  >
                    Capture Face Image
                  </Button>
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
                    onClick={handleStudentComplete}
                    className="w-full"
                    disabled={!imageBase64}
                  >
                    Complete Registration
                  </Button>
                </div>

                <div className="text-center text-sm mt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setStudentStep("details")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ← Back to details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {userType === "teacher" && (
            <>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </>
          )}

          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking create account, you agree to our{" "}
            <Link
              href="#"
              className="hover:text-primary underline underline-offset-4"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="hover:text-primary underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
