"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
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
import { GraduationCap, User, Loader2, Camera, Info } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import Webcam from "react-webcam";
import { axiosInstance, PYTHON_BACKEND_URL } from "@/lib/utils";
import { toast, Toaster } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<"teacher" | "student" | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [teacherData, setTeacherData] = useState({
    teacherName: "",
  });

  const [studentData, setStudentData] = useState({
    studentName: "",
    studentId: "",
    joinCode: "",
  });
  const [teacherErrors, setTeacherErrors] = useState({
    teacherName: "",
  });

  const [studentErrors, setStudentErrors] = useState({
    studentName: "",
    studentId: "",
    joinCode: "",
  });
  const webcamRef = useRef<Webcam>(null);
  const [imageBase64, setImageBase64] = useState("");

  const [submissionSuccess, setSubmissionSuccess] = useState<boolean | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = {
      teacherName:
        teacherData.teacherName.trim() === "" ? "Нэр заавал бөглөх ёстой" : "",
    };

    setTeacherErrors(errors);

    if (errors.teacherName) return;

    setStep(3);
  };

  const handleStudentDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = {
      studentName:
        studentData.studentName.trim() === ""
          ? "Оюутны нэр заавал бөглөх ёстой"
          : "",
      studentId:
        studentData.studentId.trim() === ""
          ? "Оюутны дугаар заавал бөглөх ёстой"
          : "",
      joinCode:
        studentData.joinCode.trim() !== "" && studentData.joinCode.length !== 6
          ? "Ангийн код 6 оронтой тоо байх ёстой"
          : "",
    };

    setStudentErrors(errors);

    if (errors.studentName || errors.studentId || errors.joinCode) return;

    console.log("Student details:", studentData);
    setStep(3);
  };

  const handleFaceCaptureComplete = async () => {
    if (!webcamRef.current) {
      toast.error("Камер ажиллахгүй байна.");
      return;
    }

    setSubmissionSuccess(true);
    setIsLoading(true);
    const screenshot = webcamRef.current.getScreenshot();
    setImageBase64(screenshot!);
    if (!screenshot) {
      toast.error("Царай авахад алдаа гарлаа. Дахин оролдоно уу.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    setSubmissionSuccess(null);

    try {
      if (userType === "student") {
        const { studentName, studentId, joinCode } = studentData;

        if (!studentName || !studentId) {
          setSubmissionSuccess(false);
          toast.error("Оюутны нэр болон дугаар заавал шаардлагатай.");
          setIsLoading(false);
          return;
        }

        const payload = {
          studentName,
          studentId,
          image_base64: screenshot, // use this
        };

        const response = await fetch(`${PYTHON_BACKEND_URL}student/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          setSubmissionSuccess(false);
          toast.error(data.message);
          setIsLoading(false);
          return;
        }

        // Step 2: Once Python registration is successful, join the classroom if `joinCode` is provided
        if (joinCode) {
          try {
            const joinRes = await axiosInstance.put("/student/joinbycode", {
              studentId,
              joinCode,
            });

            let message = data.message || "Бүртгэл амжилттай үүслээ!";
            if (joinRes.data.message) {
              message += ` Та "${
                joinRes.data.classroom?.lectureName || "ангид"
              }" ангид элслээ.`;
            }

            setSubmissionSuccess(true);
            toast.success(message);
            setTimeout(() => router.push("/"), 2000);
          } catch (joinError) {
            console.error("⚠️ Ангид элсэхэд алдаа:", joinError);
            setSubmissionSuccess(false);
            toast.error("Ангид элсэхэд алдаа гарлаа.");
            setIsLoading(false);
            return;
          }
        } else {
          setSubmissionSuccess(true);
          toast.success(data.message);
          setTimeout(() => router.push("/"), 2000);
        }
      } else if (userType === "teacher") {
        const { teacherName } = teacherData;

        if (!teacherName) {
          setSubmissionSuccess(false);
          toast.error("Багшийн нэр заавал шаардлагатай.");
          setIsLoading(false);
          return;
        }

        const payload = {
          teacherName,
          image_base64: screenshot,
        };

        const response = await fetch(`${PYTHON_BACKEND_URL}teacher/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
          setSubmissionSuccess(true);
          toast.success(data.message || "Бүртгэл амжилттай.");
          setTimeout(() => router.push("/login"), 1000);
        } else {
          setSubmissionSuccess(false);
          toast.error(data.message || "Бүртгэл үүсэхэд алдаа гарлаа.");
        }
      } else {
        setSubmissionSuccess(false);
        toast.error("Хэрэглэгчийн төрөл буруу байна.");
      }
    } catch (error: any) {
      console.error("❌ Error during registration:", error);
      setSubmissionSuccess(false);
      toast.error(
        "Бүртгэл үүсэхэд алдаа гарлаа: " +
          (error.message || "Тодорхойгүй алдаа")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, label: "Төрөл сонгох", icon: User },
    { id: 2, label: "Мэдээлэл оруулах", icon: Info },
    { id: 3, label: "Царай таниулах", icon: Camera },
  ];
  useEffect(() => {
    if (step === 1) {
      setUserType(null);
    }
  }, [step]);
  console.log(userType);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      <Navigation />
      <div className="bg-white">
        <div className="max-w-2xl mx-auto pt-6">
          <div className="flex items-center justify-between  relative">
            {steps.map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = step === stepItem.id;
              const isCompleted = step > stepItem.id;
              const isLast = index === steps.length - 1;

              // Allow clicking only on current or previous steps
              const isClickable = stepItem.id <= step;

              return (
                <div
                  key={stepItem.id}
                  onClick={() => {
                    if (isClickable) {
                      setStep(stepItem.id as 1 | 2 | 3);
                    }
                  }}
                  className={`flex-1 flex flex-col items-center relative ${
                    isClickable ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                >
                  {/* Connector line */}
                  {!isLast && (
                    <div
                      className={`absolute top-6 left-1/2 w-full h-0.5 -translate-y-1/2 ${
                        isCompleted ? "bg-slate-700" : "bg-gray-200"
                      }`}
                    />
                  )}

                  {/* Circle icon */}
                  <div
                    className={`z-10 w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                      isActive || isCompleted
                        ? "bg-slate-700 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <Icon size={20} />
                  </div>

                  {/* Label */}
                  <span
                    className={`text-sm font-medium hidden md:flex ${
                      isActive || isCompleted
                        ? "text-slate-700"
                        : "text-gray-400"
                    }`}
                  >
                    {stepItem.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          {!userType && step == 1 && (
            <Card>
              <CardHeader className="space-y-4 text-center">
                <CardTitle className="text-xl">
                  Доорхоос төрлийг сонгоно уу
                </CardTitle>
                <CardDescription>
                  Та багш эсвэл оюутан эсэхээ сонгоорой
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => {
                    setUserType("teacher");
                    setStep(2);
                  }}
                  variant="outline"
                  className="w-full h-16 flex items-center justify-center space-x-3 shadow-sm"
                  disabled={isLoading}
                >
                  <div className="flex justify-center items-center gap-3">
                    <GraduationCap className="h-6 w-6 text-teal-500" />
                    <div className="font-medium">Багш</div>
                  </div>
                </Button>

                <Button
                  onClick={() => {
                    setUserType("student");
                    setStep(2);
                  }}
                  variant="outline"
                  className="w-full h-16 flex items-center justify-center space-x-3 shadow-sm"
                  disabled={isLoading}
                >
                  <div className="flex justify-center items-center gap-3">
                    <User className="h-6 w-6 text-blue-500" />
                    <div className="font-medium">Оюутан</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          )}

          {userType === "teacher" && step === 2 && (
            <Card>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl">Багш бүртгэл</CardTitle>
                <CardDescription>
                  Оюутнуудад зориулсан QR код үүсгэхийн тулд дараахыг бөглөөрэй
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTeacherSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teacherName">Багшийн нэр</Label>
                    <Input
                      id="teacherName"
                      type="text"
                      placeholder="Бүтэн нэрээ оруулна уу"
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
                      disabled={isLoading}
                    />
                    {teacherErrors.teacherName && (
                      <p className="text-sm text-red-500">
                        {teacherErrors.teacherName}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-slate-700"
                    disabled={isLoading}
                  >
                    Үргэлжлүүлэх
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {userType === "student" && step == 2 && (
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">Оюутны бүртгэл</CardTitle>
                <CardDescription>
                  1-р алхам: Мэдээллээ оруулна уу
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleStudentDetailsSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Оюутны нэр</Label>
                    <Input
                      id="studentName"
                      type="text"
                      placeholder="Бүтэн нэрээ оруулна уу"
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
                      disabled={isLoading}
                    />
                    {studentErrors.studentName && (
                      <p className="text-sm text-red-500">
                        {studentErrors.studentName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentId">Оюутны дугаар</Label>
                    <Input
                      id="studentId"
                      type="text"
                      placeholder="Оюутны дугаараа оруулна уу"
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
                      disabled={isLoading}
                    />
                    {studentErrors.studentId && (
                      <p className="text-sm text-red-500">
                        {studentErrors.studentId}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="joinCode">Ангийн код (заавал биш)</Label>
                    <Input
                      id="joinCode"
                      type="text"
                      placeholder="6 оронтой код (жишээ: 123456)"
                      value={studentData.joinCode}
                      onChange={(e) =>
                        setStudentData({
                          ...studentData,
                          joinCode: e.target.value,
                        })
                      }
                      className={studentErrors.joinCode ? "border-red-500" : ""}
                      disabled={isLoading}
                      maxLength={6}
                    />
                    {studentErrors.joinCode && (
                      <p className="text-sm text-red-500">
                        {studentErrors.joinCode}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Хэрэв танд багшийн өгсөн ангийн код байгаа бол оруулна уу
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    Дараагийнх: Царай бүртгүүлэх
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl">Царай бүртгүүлэх</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center  space-y-4 overflow-hidden rounded-full py-2">
                  {isLoading == true ? (
                    <div className="relative w-60 h-60 flex items-center justify-center rounded-full">
                      {/* Captured face */}
                      <img
                        className="rounded-full w-55 h-55 object-cover blur-sm"
                        src={imageBase64}
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
                        className={`w-full h-full rounded-full object-cover border-2 -scale-x-100  ${
                          submissionSuccess === false && "border-red-500"
                        } ${submissionSuccess === true && "border-green-400"} 
                         ${submissionSuccess === null && "border-gray-400"}`}
                      />

                      {/* SVG overlay */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 256 256"
                        className="absolute inset-0 w-full h-full pointer-events-none mt-2"
                      >
                        <path
                          style={{
                            stroke: "white",
                          }}
                          fill="none"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="4 5"
                          transform="scale(1.2) translate(-25 3)" // 🔹 makes it bigger & recenters
                          d="M72.2,95.9c0,5.5,4.1,9.9,9.1,9.9c0,0,0.1,0,0.2,0c1.9,26.2,22,52.4,46.5,52.4c24.5,0,44.6-26.2,46.5-52.4
                c0,0,0.1,0,0.2,0c5,0,9.1-4.5,9.1-9.9c0-4.1-2.2-7.5-5.4-9.1c1.9-5.9,2.8-12.2,2.8-18.8C181.2,36,157.4,10,128,10
                c-29.4,0-53.2,26-53.2,58.1c0,6.6,1,12.9,2.9,18.8C74.4,88.4,72.2,91.8,72.2,95.9z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => handleFaceCaptureComplete()}
                  className="w-full mt-4 bg-slate-700"
                  disabled={isLoading}
                >
                  {isLoading ? <>Бүртгэж байна...</> : "Бүртгэлийг дуусгах"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
