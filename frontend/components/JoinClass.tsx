"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef } from "react";
import { GraduationCap, Users, Calendar, Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import {
  captureAndVerify,
  simulateRecognition,
  startCamera,
  stopCamera,
} from "@/utils/attendanceUtils";
import { Toaster, toast } from "sonner";

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
  const [isLoading, setIsLoading] = useState(false);
  const [lectureName, setLectureName] = useState("...");
  const [teacherName, setTeacherName] = useState("...");
  const [classroomId, setClassroomId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isFaceVerified, setIsFaceVerified] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionProgress, setRecognitionProgress] = useState(0);
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
    } catch (error) {
      setLectureName("Токен буруу байна");
      setTeacherName("Токен буруу байна");
      console.error("JWT decode error:", error);
    }
  }, [token]);

  const handleVerifyFace = async () => {
    if (!studentId.trim()) {
      setMessage("Оюутны ID шаардлагатай.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    await startCamera(videoRef, setMessage, streamRef);

    const onVerificationComplete = async () => {
      const verified = await captureAndVerify(
        videoRef,
        canvasRef,
        studentId,
        setMessage,
        setIsRecognizing,
        setRecognitionProgress
      );

      if (verified) {
        setMessage("🎉 Царай амжилттай танигдлаа.");
        setIsFaceVerified(true);
      }

      stopCamera(streamRef);
      setIsLoading(false);
    };

    simulateRecognition(
      setIsRecognizing,
      setRecognitionProgress,
      onVerificationComplete
    );
  };

  const handleJoinClass = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `https://myrmidons-pinequest-backend.vercel.app/student/join/${classroomId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.custom(() => (
          <div className="w-[400px] p-4 rounded-xl shadow-lg bg-[#18181b] text-white flex items-center gap-4 transition-all">
            <Check className="size-4 text-white" />
            <span className="text-[16px] font-medium text-[#FAFAFA]">
              Хичээлд амжилттай нэгдлээ!
            </span>
          </div>
        ));
      } else {
        setMessage(data.message || "Алдаа гарлаа.");
      }
    } catch (error) {
      console.error("❌ Error joining classroom:", error);
      setMessage("Сүлжээний алдаа. Дахин оролдоно уу.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="bg-white rounded-lg border shadow-sm w-full">
        <div className="p-6 pb-0 text-center space-y-4">
          <h3 className="text-2xl font-semibold">Хичээлд нэгдэх</h3>
          <p className="text-sm text-gray-600">
            Доорх хичээлд нэгдэхийн тулд ID-гаа оруулж, товчийг дарна уу.
          </p>
        </div>

        <div className="p-6 pt-0 space-y-6">
          {/* Teacher Info */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-sm text-gray-600">Багш</div>
              <div className="font-semibold text-gray-900">{teacherName}</div>
            </div>
          </div>

          {/* Lecture Info */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Calendar className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-sm text-gray-600">Хичээлийн нэр</div>
              <div className="font-semibold text-gray-900">{lectureName}</div>
            </div>
          </div>

          {/* Student ID Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Оюутны ID
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="24LP0000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Step 1: Face Verification */}
          {!isFaceVerified && (
            <button
              onClick={handleVerifyFace}
              disabled={isLoading || !studentId.trim()}
              className="w-full h-12 text-lg font-medium inline-flex items-center justify-center rounded-md text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Таних...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Царайгаар баталгаажуулах</span>
                </div>
              )}
            </button>
          )}

          {/* Step 2: Join Class */}
          {isFaceVerified && (
            <button
              onClick={handleJoinClass}
              disabled={isLoading}
              className="w-full h-12 text-lg font-medium inline-flex items-center justify-center rounded-md text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Нэгдэж байна...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Хичээлд нэгдэх</span>
                </div>
              )}
            </button>
          )}
          <Toaster position="bottom-right" />

          {/* Error Message */}
          {message && (
            <p className="text-sm text-red-600 text-center">{message}</p>
          )}

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Хичээлд нэгдсний дараа та бүх материал болон гэрийн даалгаварт
              хандах боломжтой болно.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinClassPage;
