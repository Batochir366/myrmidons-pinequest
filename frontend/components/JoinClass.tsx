"use client";
import React, { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import {
  startCamera,
  stopCamera,
  captureAndVerify,
  simulateRecognition,
} from "@/utils/attendanceUtils";
import { useSearchParams } from "next/navigation";
import { Toaster, toast } from "sonner";
import { CheckCircle, ArrowRight, Users } from "lucide-react";

const JoinClassPage = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [studentId, setStudentId] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [classroomId, setClassroomId] = useState("");
  const [lectureName, setLectureName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [message, setMessage] = useState("");
  const [recognitionProgress, setRecognitionProgress] = useState(0);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode<{
        classroomId: string;
        lectureName: string;
        teacherName: string;
      }>(token);

      setClassroomId(decoded.classroomId);
      setLectureName(decoded.lectureName);
      setTeacherName(decoded.teacherName);
    } catch (err) {
      setMessage("Токен алдаатай байна.");
    }
  }, [token]);

  useEffect(() => {
    if (step === 2) {
      startCamera(videoRef, setMessage, streamRef);
    } else {
      stopCamera(streamRef);
    }
  }, [step]);

  const handleFaceRecognition = async () => {
    simulateRecognition(setIsRecognizing, setRecognitionProgress, async () => {
      const verified = await captureAndVerify(
        videoRef,
        canvasRef,
        studentId,
        setMessage,
        setIsRecognizing,
        setRecognitionProgress
      );

      if (verified) {
        setStep(3);
      } else {
        setMessage("Царай танигдсангүй.");
      }
    });
  };

  const handleJoinClass = async () => {
    setIsLoading(true);
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
        toast.success("Хичээлд амжилттай нэгдлээ!");
      } else {
        setMessage(data.message || "Алдаа гарлаа.");
      }
    } catch (error) {
      setMessage("Сүлжээний алдаа.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <Toaster position="bottom-right" />
      {/* Step 1: Enter ID */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Оюутны ID оруулна уу</h2>
          <input
            className="w-full border px-4 py-2 rounded mb-4"
            placeholder="24LP0000"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
          <button
            disabled={!studentId.trim()}
            onClick={() => setStep(2)}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full flex items-center justify-center gap-2"
          >
            Үргэлжлүүлэх <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Step 2: Face Verification */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Царай таних</h2>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 object-cover rounded border mb-4"
          />
          <canvas ref={canvasRef} className="hidden" />

          {isRecognizing ? (
            <div>
              <p>Таних явц: {recognitionProgress}%</p>
              <div className="w-full bg-gray-200 h-2 rounded">
                <div
                  className="bg-blue-600 h-2 rounded"
                  style={{ width: `${recognitionProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={handleFaceRecognition}
              className="bg-blue-600 text-white px-4 py-2 rounded w-full"
            >
              Царай таних
            </button>
          )}

          {message && <p className="text-red-500 text-sm mt-2">{message}</p>}
        </div>
      )}

      {/* Step 3: Join Class */}
      {step === 3 && (
        <div>
          <div className="flex items-center justify-center mb-4">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-center mb-2">
            Царай амжилттай баталгаажлаа!
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Хичээлд нэгдэхийн тулд доорх товчийг дарна уу.
          </p>
          <button
            onClick={handleJoinClass}
            disabled={isLoading}
            className="bg-green-600 text-white px-4 py-2 rounded w-full"
          >
            {isLoading ? "Нэгдэж байна..." : "Хичээлд нэгдэх"}
          </button>
        </div>
      )}
    </div>
  );
};

export default JoinClassPage;
