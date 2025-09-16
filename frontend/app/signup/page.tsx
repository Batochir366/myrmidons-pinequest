"use client";

import type React from "react";

import { useState, useEffect } from "react";
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

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Teacher signup attempt:", teacherData);
    router.push("/");
  };

  const handleStudentDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  useEffect(() => {
    if (studentStep === "face") {
      startFaceRecognition();
    }
  }, [studentStep]);

  const handleStudentComplete = () => {
    console.log("Student registration complete:", studentData);
    router.push("/");
  };

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
            <p className="text-sm text-muted-foreground">
              Choose your account type to get started
            </p>
          </div>

          {!userType && (
            <Card>
              <CardHeader className="space-y-1">
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
                  <GraduationCap className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-medium">Teacher</div>
                    <div className="text-sm text-muted-foreground">
                      Generate QR codes for attendance
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => setUserType("student")}
                  variant="outline"
                  className="w-full h-16 flex items-center justify-center space-x-3"
                >
                  <User className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-medium">Student</div>
                    <div className="text-sm text-muted-foreground">
                      Register for QR attendance
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          )}

          {userType === "teacher" && (
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">Teacher Sign up</CardTitle>
                <CardDescription>
                  Create your account to generate QR codes for student
                  attendance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTeacherSubmit} className="space-y-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex items-center space-x-2 text-sm font-medium text-primary">
                      <GraduationCap className="h-4 w-4" />
                      <span>Teacher Account</span>
                    </div>
                  </div>

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
                      required
                    />
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
                      required
                    />
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
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex items-center space-x-2 text-sm font-medium text-primary">
                      <User className="h-4 w-4" />
                      <span>Student Registration</span>
                    </div>
                  </div>

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
                      required
                    />
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
                      required
                    />
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
                  Please look directly at the camera
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    {/* Concentric circles for camera viewfinder */}
                    <div className="absolute inset-0 rounded-full border-2 border-muted-foreground/20"></div>
                    <div className="absolute inset-4 rounded-full border-2 border-muted-foreground/30"></div>
                    <div className="absolute inset-8 rounded-full border-2 border-muted-foreground/40"></div>
                    <div className="absolute inset-12 rounded-full border-2 border-muted-foreground/50"></div>

                    {/* Camera icon in center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Registration Progress
                    </span>
                    <span className="text-sm font-medium">
                      {recognitionProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${recognitionProgress}%` }}
                    ></div>
                  </div>
                </div>

                {isRecognitionComplete && (
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <Eye className="h-5 w-5" />
                      <span className="font-medium">
                        Registration Complete!
                      </span>
                    </div>
                    <Button onClick={handleStudentComplete} className="w-full">
                      Complete Registration
                    </Button>
                  </div>
                )}

                <div className="text-center text-sm">
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

              <div className="text-center text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                <p className="font-medium mb-1">For Students:</p>
                <p>
                  Register once, then simply scan QR codes to mark attendance.
                  No login required!
                </p>
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
