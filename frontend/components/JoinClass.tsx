// components/JoinClassPage.tsx
"use client";

import React, { useState, useEffect } from "react";
import { User, Camera, CheckCircle, ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Toaster, toast } from "sonner";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { joinClassroom } from "@/utils/attendanceUtils";
import { FaceRecognitionStep } from "./FaceRecognition";

interface TokenPayload {
  classroomId: string;
  lectureName: string;
  teacherName: string;
  iat?: number;
  exp?: number;
}

const JoinClassPage = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lectureName, setLectureName] = useState<string>("...");
  const [teacherName, setTeacherName] = useState<string>("...");
  const [classroomId, setClassroomId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isFaceVerified, setIsFaceVerified] = useState<boolean>(false);

  const steps = [
    { id: 1, label: "Оюутны ID", icon: User },
    { id: 2, label: "Царай таних", icon: Camera },
    { id: 3, label: "Амжилттай", icon: CheckCircle },
  ];

  useEffect(() => {
    if (!token) {
      setLectureName("Токен олдсонгүй");
      setTeacherName("Токен олдсонгүй");
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      setLectureName(decoded.lectureName || "Хичээлийн нэр олдсонгүй");
      setTeacherName(decoded.teacherName || "Багшийн нэр олдсонгүй");
      setClassroomId(decoded.classroomId);
      console.log("Decoded token:", decoded);
    } catch (error) {
      setLectureName("Токен буруу байна");
      setTeacherName("Токен буруу байна");
      console.error("JWT decode error:", error);
    }
  }, [token]);

  const handleFaceVerificationSuccess = async (
    name?: string
  ): Promise<void> => {
    setMessage(
      `🎉 Сайн байна уу, ${name || "Оюутан"}! Царай амжилттай танигдлаа.`
    );
    setIsFaceVerified(true);

    // Automatically proceed to join classroom after face verification
    await handleJoinClass(name);
  };

  const handleJoinClass = async (studentName?: string): Promise<void> => {
    setIsLoading(true);
    setMessage("Хичээлд нэгдэж байна...");

    try {
      const result = await joinClassroom(
        classroomId,
        studentId,
        lectureName,
        studentName
      );

      if (result.success) {
        setStep(3);
        setMessage(
          result.alreadyJoined
            ? `Сайн байна уу, ${
                studentName || "Оюутан"
              }! Та аль хэдийнэ хичээлд нэгдсэн байна.`
            : `Сайн байна уу, ${
                studentName || "Оюутан"
              }! Хичээлд амжилттай нэгдлээ!`
        );

        toast.custom(() => (
          <div className="w-[400px] p-4 rounded-xl shadow-lg bg-[#18181b] text-white flex items-center gap-4 transition-all">
            <CheckCircle className="size-4 text-white" />
            <span className="text-[16px] font-medium text-[#FAFAFA]">
              {result.alreadyJoined
                ? "Аль хэдийнэ нэгдсэн байна!"
                : "Хичээлд амжилттай нэгдлээ!"}
            </span>
          </div>
        ));
      } else {
        setMessage(result.message || "Хичээлд нэгдэхэд алдаа гарлаа.");
        setIsFaceVerified(false);
      }
    } catch (error) {
      console.error("❌ Error joining classroom:", error);
      setMessage("Сүлжээний алдаа. Дахин оролдоно уу.");
      setIsFaceVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Хичээлд нэгдэх
              </h2>
              <p className="text-gray-600">
                Хичээлийн мэдээлэл болон оюутны ID-г оруулна уу
              </p>
            </div>

            {/* Class Information */}
            <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Багш:</span>
                <span className="font-medium text-gray-900">{teacherName}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Хичээл:</span>
                <span className="font-medium text-gray-900">{lectureName}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Оюутны ID
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="24LP0000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <button
                onClick={() => studentId.trim() && setStep(2)}
                disabled={!studentId.trim()}
                className="w-full bg-slate-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                Царай таних руу үргэлжлүүлэх
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <FaceRecognitionStep
            studentId={studentId}
            attendanceId=""
            message={message}
            setMessage={setMessage}
            onSuccess={handleFaceVerificationSuccess}
            context="join"
            classroomId={classroomId}
          />
        );

      case 3:
        return (
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Хичээлд амжилттай нэгдлээ!
              </h2>
              <p className="text-gray-600">{message}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Оюутны ID:</span>
                <span className="font-medium text-gray-900">{studentId}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Хичээл:</span>
                <span className="font-medium text-gray-900">{lectureName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Багш:</span>
                <span className="font-medium text-gray-900">{teacherName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Цаг:</span>
                <span className="font-medium text-gray-900">
                  {new Date().toLocaleTimeString("mn-MN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Төлөв:</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Нэгдсэн
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Та одоо хичээлд оролцож болно. Ирц өгөх бол QR код сканнердэнэ
                үү.
              </p>

              <button
                onClick={() => window.close()}
                className="bg-slate-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Хаах
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProgressIndicator step={step} />
      <div className="flex-1 flex items-center justify-center p-6">
        {renderStep()}
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default JoinClassPage;
