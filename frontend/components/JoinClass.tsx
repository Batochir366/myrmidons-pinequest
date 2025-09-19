"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef } from "react";
import { GraduationCap, Calendar, Check, Camera } from "lucide-react";
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

  const [step, setStep] = useState<1 | 2>(1);
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
      {/* Progress Bar */}
      <div className="flex space-x-6 mb-8">
        {[1, 2].map((num) => (
          <div key={num} className="flex flex-col items-center">
            <div
              className={`w-12 h-12 flex items-center justify-center rounded-full text-white font-bold ${
                step === num ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              {num}
            </div>
            <span className="text-sm mt-2 text-gray-700">
              {num === 1 ? "Хичээл мэдээлэл" : "Нэвтрэх"}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Show teacher & lecture info */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-6">
          <h2 className="text-2xl font-semibold text-center">Хичээлд нэгдэх</h2>

          <div className="flex items-center space-x-4">
            <GraduationCap className="text-blue-600" size={32} />
            <div>
              <p className="text-gray-600 text-sm">Багш</p>
              <p className="font-medium text-lg">
                {teacherName || "Олдсонгүй"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Calendar className="text-green-600" size={32} />
            <div>
              <p className="text-gray-600 text-sm">Хичээлийн нэр</p>
              <p className="font-medium text-lg">
                {lectureName || "Олдсонгүй"}
              </p>
            </div>
          </div>

          <button
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            onClick={() => setStep(2)}
          >
            Үргэлжлүүлэх
          </button>
        </div>
      )}

      {/* Step 2: Student ID input + Face recognition */}
      {step === 2 && (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-6">
          <h2 className="text-2xl font-semibold text-center mb-4">Нэвтрэх</h2>

          <label className="block mb-1 font-medium text-gray-700">
            Оюутны ID
          </label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="24LP0000"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
          />

          {/* Camera + face recognition */}
          <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-gray-300">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!streamRef.current && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Camera size={48} className="text-gray-400" />
              </div>
            )}
          </div>

          {/* Recognition progress */}
          {isRecognizing && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${recognitionProgress}%` }}
              />
            </div>
          )}

          {message && (
            <p
              className={`text-center mt-2 ${
                message.startsWith("🎉") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}

          {/* Face recognition button or join button */}
          {!isFaceVerified ? (
            <button
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
              disabled={!studentId.trim() || isRecognizing || isLoading}
              onClick={handleVerifyFace}
            >
              {isRecognizing ? "Таних..." : "Царайгаар баталгаажуулах"}
            </button>
          ) : (
            <button
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              disabled={isLoading}
              onClick={handleJoinClass}
            >
              {isLoading ? "Нэгдэж байна..." : "Хичээлд нэгдэх"}
            </button>
          )}
        </div>
      )}

      <Toaster position="bottom-right" />
    </div>
  );
};

export default JoinClassPage;
