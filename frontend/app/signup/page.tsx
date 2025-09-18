"use client";

import type React from "react";

import { useState, useRef } from "react";
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
import { QrCode, GraduationCap, User, Loader2 } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import Webcam from "react-webcam";

export default function SignupPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<"teacher" | "student" | null>(null);
  const [step, setStep] = useState<"details" | "face">("details");
  const [teacherData, setTeacherData] = useState({
    teacherName: "",
  });

  const [studentData, setStudentData] = useState({
    studentName: "",
    studentId: "",
  });
  const [teacherErrors, setTeacherErrors] = useState({
    teacherName: "",
  });

  const [studentErrors, setStudentErrors] = useState({
    studentName: "",
    studentId: "",
  });
  const webcamRef = useRef<Webcam>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null
  );
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

    setStep("face");
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
    };

    setStudentErrors(errors);

    if (errors.studentName || errors.studentId) return;

    console.log("Student details:", studentData);
    setStep("face");
  };

  const capture = () => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot();
      if (screenshot) {
        setImageBase64(screenshot);
        setSubmissionMessage("Царай амжилттай авагдлаа.");
      }
    }
  };

  const handleFaceCaptureComplete = async () => {
    if (!imageBase64) {
      setSubmissionSuccess(false);
      setSubmissionMessage("Зураг авна уу.");
      return;
    }

    let payload;
    let endpoint;

    if (userType === "student") {
      if (!studentData.studentName || !studentData.studentId) {
        setSubmissionSuccess(false);
        setSubmissionMessage("Оюутны нэр болон дугаар заавал шаардлагатай.");
        return;
      }

      payload = {
        studentName: studentData.studentName,
        studentId: studentData.studentId,
        image_base64: imageBase64,
      };

      endpoint =
        "https://myrmidons-pinequest-production.up.railway.app/register";
    } else if (userType === "teacher") {
      if (!teacherData.teacherName) {
        setSubmissionSuccess(false);
        setSubmissionMessage("Багшийн нэр заавал шаардлагатай.");
        return;
      }

      payload = {
        teacherName: teacherData.teacherName,
        image_base64: imageBase64,
      };
      endpoint =
        "https://myrmidons-pinequest-production.up.railway.app/teacher/register";
    } else {
      setSubmissionSuccess(false);
      setSubmissionMessage("Хэрэглэгчийн төрөл буруу байна.");
      return;
    }

    setIsLoading(true);
    setSubmissionMessage("Бүртгэж байна...");
    setSubmissionSuccess(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmissionSuccess(true);
        setSubmissionMessage(data.message || "Бүртгэл амжилттай үүслээ!");

        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setSubmissionSuccess(false);
        setSubmissionMessage(data.message || "Бүртгэл үүсэхэд алдаа гарлаа.");
      }
    } catch (error: any) {
      setSubmissionSuccess(false);
      setSubmissionMessage(
        "Бүртгэл үүсэхэд алдаа гарлаа: " +
          (error.message || "Тодорхойгүй алдаа")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <QrCode className="mx-auto h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Бүртгэл үүсгэх
            </h1>
          </div>

          {!userType && (
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
                  onClick={() => setUserType("teacher")}
                  variant="outline"
                  className="w-full h-16 flex items-center justify-center space-x-3"
                  disabled={isLoading}
                >
                  <div className="flex justify-center items-center gap-3">
                    <GraduationCap className="h-6 w-6 ml-2" />
                    <div className="font-medium">Багш</div>
                  </div>
                </Button>

                <Button
                  onClick={() => setUserType("student")}
                  variant="outline"
                  className="w-full h-16 flex items-center justify-center space-x-3"
                  disabled={isLoading}
                >
                  <div className="flex justify-center items-center gap-3">
                    <User className="h-6 w-6 ml-2" />
                    <div className="font-medium">Оюутан</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          )}

          {userType === "teacher" && step !== "face" && (
            <Card>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl">Багш бүртгүүлнэ үү</CardTitle>
                <CardDescription>
                  Оюутнуудад зориулсан QR код үүсгэхийн тулд дараахыг үүсгээрэй
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

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    Үргэлжлүүлэх
                  </Button>
                </form>

                <div className="mt-4 text-center text-sm">
                  <Button
                    variant="ghost"
                    onClick={() => setUserType(null)}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    ← Бүртгэлийн төрөл рүү буцах
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {userType === "student" && step === "details" && (
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

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    Дараагийнх: Царай бүртгүүлэх
                  </Button>
                </form>

                <div className="mt-4 text-center text-sm">
                  <Button
                    variant="ghost"
                    onClick={() => setUserType(null)}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    ← Бүртгэлийн төрөл рүү буцах
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "face" && (
            <Card>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl">Царай бүртгүүлэх</CardTitle>
                <CardDescription>
                  2-р алхам: Цараагаа камер дээр тавиад зураг авна уу
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
                    disabled={isLoading}
                  >
                    Царайн зураг авах
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
                    onClick={handleFaceCaptureComplete}
                    className="w-full"
                    disabled={!imageBase64 || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Бүртгэж байна...
                      </>
                    ) : (
                      "Бүртгэлийг дуусгах"
                    )}
                  </Button>
                </div>

                <div className="text-center text-sm mt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setStep("details")}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    ← Мэдээлэл рүү буцах
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {userType === "teacher" && (
            <>
              <div className="mt-4 text-center text-sm">
                Бүртгэлтэй юу?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Нэвтрэх
                </Link>
              </div>
            </>
          )}

          <p className="px-8 text-center text-sm text-muted-foreground">
            Бүртгэл үүсгэх товчлуурыг дарснаар та манай{" "}
            <Link
              href="#"
              className="hover:text-primary underline underline-offset-4"
            >
              Үйлчилгээний нөхцөл
            </Link>{" "}
            болон{" "}
            <Link
              href="#"
              className="hover:text-primary underline underline-offset-4"
            >
              Нууцлалын бодлого
            </Link>
            -той зөвшөөрч байна.
          </p>
        </div>
      </div>
    </div>
  );
}
