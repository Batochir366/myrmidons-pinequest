"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera } from "lucide-react";
import Webcam from "react-webcam";
import { Toaster, toast } from "sonner";
import { jwtDecode } from "jwt-decode";
import { PYTHON_BACKEND_URL } from "@/lib/utils";
import { joinClassroom } from "@/utils/attendanceUtils";
import { Navigation } from "./Navigation";
import { InvalidToken } from "./InvalidToken";

interface TokenPayload {
  classroomId: string;
  lectureName: string;
  teacherName: string;
}

const JoinClassPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [classroomId, setClassroomId] = useState("");
  const [lectureName, setLectureName] = useState("...");
  const [teacherName, setTeacherName] = useState("...");
  const [studentId, setStudentId] = useState("");
  const [studentIdError, setStudentIdError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [message, setMessage] = useState("");
  const [src, setSrc] = useState("");
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      try {
        const decoded = jwtDecode<TokenPayload>(token);
        setClassroomId(decoded.classroomId);
        setLectureName(decoded.lectureName);
        setTeacherName(decoded.teacherName);
      } catch (error) {
        console.error("⚠️ Token decode error:", error);
        toast.error("Токен буруу байна.");
      }
    } else {
      toast.error("Токен олдсонгүй.");
    }
  }, []);
  if (!classroomId || !lectureName || !teacherName) {
    return <InvalidToken />;
  }
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (studentId.trim() === "") {
      setStudentIdError("Оюутны ID заавал бөглөх ёстой");
      return;
    }
    setStudentIdError("");

    if (!webcamRef.current) {
      toast.error("Камер ажиллахгүй байна.");
      return;
    }

    setIsCapturing(true);
    setIsLoading(true);

    const screenshot = webcamRef.current.getScreenshot();
    setSrc(screenshot!);
    if (!screenshot) {
      toast.error("Царай авахад алдаа гарлаа. Дахин оролдоно уу.");
      setIsCapturing(false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${PYTHON_BACKEND_URL}student/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          studentId,
          image_base64: screenshot,
        }),
      });

      const contentType = response.headers.get("content-type");
      const rawText = await response.text();

      if (!contentType || !contentType.includes("application/json")) {
        toast.error("Сервертэй холбогдоход алдаа гарлаа");
        return;
      }

      const data = JSON.parse(rawText);

      if (response.ok) {
        try {
          const result = await joinClassroom(
            classroomId,
            studentId,
            setMessage
          );
          if (result.success) {
            toast.success(
              result.alreadyJoined
                ? "Та аль хэдийн энэ ангид байна"
                : "Хичээлд амжилттай нэгдлээ"
            );
            if (!result.alreadyJoined)
              toast.success("Хичээлд амжилттай нэгдлээ");
            setTimeout(() => {
              router.push("/");
            }, 3000);
          }
        } catch (error) {
          console.error(error);
          toast.error("Нэгдэхэд алдаа гарлаа");
        }
      } else if (data.message === "Unknown face or no face found") {
        toast.error("Царай олдсонгүй эсвэл бүртгэлгүй байна");
      } else if (data.message === "Face does not match student ID") {
        toast.error("Царай оюутны ID-тай тохирохгүй байна");
      } else {
        toast.error(data.message || "Нэгдэхэд алдаа гарлаа");
      }
    } catch (error: any) {
      console.error("Join error:", error);
      toast.error(error.message || "Сүлжээний алдаа.");
    } finally {
      setIsCapturing(false);
      setIsLoading(false);
      setSrc("");
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-background justify-center">
      <Navigation />
      <Toaster position="top-right" />

      <div className="flex items-center justify-center min-h-screen py-12">
        <div className="mx-auto flex w-screen flex-col justify-center space-y-6 sm:w-[400px] px-4">
          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl">Хичээлд нэгдэх</CardTitle>
              <CardDescription>
                Та <b>{teacherName}</b> багшийн <b>{lectureName}</b> хичээлд
                орохдоо оюутны кодоо оруулж, царайгаа баталгаажуулна уу.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleJoin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Оюутны ID</Label>
                  <Input
                    id="studentId"
                    type="text"
                    placeholder="24LP0000"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className={studentIdError ? "border-red-500" : ""}
                    disabled={isLoading || isCapturing}
                    required
                  />
                  {studentIdError && (
                    <p className="text-sm text-red-500">{studentIdError}</p>
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
                        className="w-full h-full rounded-full object-cover border-2 border-gray-300 -scale-x-100"
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
                  disabled={studentId.trim() === "" || isLoading || isCapturing}
                >
                  {isLoading || isCapturing ? (
                    <>Нэгдэж байна...</>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      Хичээлд нэгдэх
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
};

export default JoinClassPage;
