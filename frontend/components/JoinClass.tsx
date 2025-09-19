"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef } from "react";
import { User, Camera, CheckCircle, ArrowRight, Eye } from "lucide-react";
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

  const steps = [
    { id: 1, label: "Оюутны ID", icon: User },
    { id: 2, label: "Царай таних", icon: Camera },
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

  useEffect(() => {
    if (step === 2) {
      startCamera(videoRef, setMessage, streamRef);
    }

    return () => {
      stopCamera(streamRef);
    };
  }, [step]);

  const handleRecognitionComplete = async () => {
    const onSuccess = (name?: string) => {
      setMessage(
        `🎉 Сайн байна уу, ${name || "Оюутан"}! Царай амжилттай танигдлаа.`
      );
      setIsFaceVerified(true);
      stopCamera(streamRef);
    };

    const verified = await captureAndVerify(
      videoRef,
      canvasRef,
      studentId,
      setMessage,
      setIsRecognizing,
      setRecognitionProgress,
      onSuccess
    );

    if (!verified) {
      // Reset recognition state if verification failed
      setIsRecognizing(false);
      setRecognitionProgress(0);
    }
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
            <CheckCircle className="size-4 text-white" />
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Progress Indicator */}
      <div className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            {steps.map((stepItem) => {
              const Icon = stepItem.icon;
              const isActive = step === stepItem.id;
              const isCompleted = step > stepItem.id;

              return (
                <div key={stepItem.id} className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                      isActive || isCompleted
                        ? "bg-slate-700 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  <span
                    className={`text-sm font-medium ${
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

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-slate-700 h-2 rounded-full transition-all duration-500"
              style={{
                width: step === 1 ? "50%" : "100%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        {/* Step 1: Student ID Entry + Class Info */}
        {step === 1 && (
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
        )}

        {/* Step 2: Face Recognition */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Царай таних
              </h2>
              <p className="text-gray-600">Камерт шууд харна уу</p>
            </div>

            {/* Camera Viewfinder */}
            <div className="relative mb-6">
              <div className="w-64 h-64 mx-auto relative">
                <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
                <div className="absolute inset-2 rounded-full border border-gray-300"></div>
                <div className="absolute inset-4 rounded-full border border-gray-400"></div>

                <div className="absolute inset-6 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!streamRef.current && (
                    <Camera size={48} className="text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {isRecognizing && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Таних явц
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {recognitionProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-slate-700 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${recognitionProgress}%` }}
                  />
                </div>
              </div>
            )}

            {isFaceVerified && (
              <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                <Eye size={18} />
                <span className="font-medium">Таних амжилттай боллоо!</span>
              </div>
            )}

            {message && (
              <p
                className={`text-sm text-center mb-4 ${
                  message.startsWith("🎉") ? "text-green-600" : "text-red-600"
                }`}
              >
                {message}
              </p>
            )}

            {/* Action Buttons */}
            {!isFaceVerified ? (
              !isRecognizing && recognitionProgress === 0 ? (
                <button
                  onClick={() =>
                    simulateRecognition(
                      setIsRecognizing,
                      setRecognitionProgress,
                      handleRecognitionComplete
                    )
                  }
                  className="w-full bg-slate-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                >
                  Царай таних
                </button>
              ) : null
            ) : (
              <button
                onClick={handleJoinClass}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? "Нэгдэж байна..." : "Хичээлд нэгдэх"}
                {!isLoading && <CheckCircle size={18} />}
              </button>
            )}
          </div>
        )}
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
};

export default JoinClassPage;
