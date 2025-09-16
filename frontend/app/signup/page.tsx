"use client";

import type React from "react";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/Navigation";

export default function SignupPage() {
  const router = useRouter();

  const [studentStep, setStudentStep] = useState<"details" | "face">("details");
  const [teacherData, setTeacherData] = useState("");
  const [studentData, setStudentData] = useState({
    studentName: "",
    studentId: "",
  });
  const [recognitionProgress, setRecognitionProgress] = useState(0);
  const [isRecognitionComplete, setIsRecognitionComplete] = useState(false);

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Teacher signup attempt:", teacherData);
    router.push("/teacher");
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
    router.push("/student");
  };

  return (
    <div className=" min-h-screen bg-background justify-center px-4 md:px-0 items-center ">
      <Navigation />

      <div className="flex justify-center items-center h-screen -mt-16">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Багш бүртгүүлэх</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTeacherSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teacherName">Багшийн нэр</Label>
                  <Input
                    id="teacherName"
                    type="text"
                    placeholder="Бүтэн нэрээ оруулна уу"
                    value={teacherData}
                    onChange={(e) => setTeacherData(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  үүсгэх
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* {userType === "student" && studentStep === "details" && (
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
          )} */}

          {/* {userType === "student" && studentStep === "face" && (
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
                 
                    <div className="absolute inset-0 rounded-full border-2 border-muted-foreground/20"></div>
                    <div className="absolute inset-4 rounded-full border-2 border-muted-foreground/30"></div>
                    <div className="absolute inset-8 rounded-full border-2 border-muted-foreground/40"></div>
                    <div className="absolute inset-12 rounded-full border-2 border-muted-foreground/50"></div>

                 
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
          )} */}

          {/* {userType === "teacher" && (
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
          )} */}
        </div>
      </div>
    </div>
  );
}
