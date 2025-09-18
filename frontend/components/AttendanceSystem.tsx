"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
  QrCode,
  User,
  Camera,
  CheckCircle,
  ArrowRight,
  Eye,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { QRError } from "@/components/QRerror";
import {
  captureAndVerify,
  simulateRecognition,
  startCamera,
  stopCamera,
} from "@/utils/attendanceUtils";

const AttendanceSystem: React.FC = () => {
  const [studentId, setStudentId] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [message, setMessage] = useState("");
  const [recognitionProgress, setRecognitionProgress] = useState(0);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const searchParams = useSearchParams();

  const token = String(searchParams.get("token"));
  const expiresAt = Number(searchParams.get("expiresAt"));
  const now = Date.now();

  if (!token || (!expiresAt && now > expiresAt)) {
    return <QRError />;
  }

  const steps = [
    { id: 1, label: "QR код", icon: QrCode },
    { id: 2, label: "Оюутны ID", icon: User },
    { id: 3, label: "Царай таних", icon: Camera },
    { id: 4, label: "Амжилттай", icon: CheckCircle },
  ];

  useEffect(() => {
    if (step === 2) {
      startCamera(videoRef, setMessage, streamRef);
    }

    return () => {
      stopCamera(streamRef);
    };
  }, [step]);

  const handleRecognitionComplete = async () => {
    const verified = await captureAndVerify(
      videoRef,
      canvasRef,
      studentId,
      setMessage,
      setIsRecognizing,
      setRecognitionProgress
    );
    if (verified) {
      stopCamera(streamRef);
      setStep(3);
    }
  };
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString("mn-MN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Progress Indicator */}
      <div className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            {steps.map((stepItem) => {
              const Icon = stepItem.icon;
              const isActive =
                step === stepItem.id || (step === 3 && stepItem.id === 4);
              const isCompleted =
                step > stepItem.id || (step === 3 && stepItem.id <= 4);

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
                width: step === 1 ? "25%" : step === 2 ? "75%" : "100%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        {/* Step 1: Student ID Entry */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Оюутны ID-г оруулна уу
              </h2>
              <p className="text-gray-600">
                Ирцээ баталгаажуулахын тулд оюутны ID-г оруулна уу
              </p>
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

            {recognitionProgress === 100 && (
              <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                <Eye size={18} />
                <span className="font-medium">Таних амжилттай боллоо!</span>
              </div>
            )}

            {!isRecognizing && recognitionProgress === 0 && (
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
            )}

            {message && (
              <p className="mt-4 text-sm text-red-600 text-center">{message}</p>
            )}
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Ирц амжилттай бүртгэгдлээ!
              </h2>
              <p className="text-gray-600">{message}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Оюутны ID:</span>
                <span className="font-medium text-gray-900">{studentId}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Цаг:</span>
                <span className="font-medium text-gray-900">
                  {getCurrentTime()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Огноо:</span>
                <span className="font-medium text-gray-900">
                  {getCurrentDate()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Төлөв:</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Батлагдсан
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceSystem;
