"use client";

import React, { useState, useRef, useEffect } from "react";
import { User, Camera, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { QRError } from "@/components/QRerror";
import {
  captureAndVerify,
  startCamera,
  stopCamera,
  recordAttendance,
} from "@/utils/attendanceUtils";
import { getLocation } from "@/utils/getLocation";
import { jwtDecode } from "jwt-decode";
import { axiosInstance, PYTHON_BACKEND_URL } from "@/lib/utils";
import Webcam from "react-webcam";
import { Toaster, toast } from "sonner";
import { useRouter } from "next/navigation";

type Student = {
  studentId: string;
  embedding: number[];
  _id: string;
};

const AttendanceSystem: React.FC = () => {
  const [studentId, setStudentId] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [paramsLoaded, setParamsLoaded] = useState(false);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [src, setSrc] = useState<string>("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [message, setMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const router = useRouter();
  // Load params from token
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sp = new URLSearchParams(window.location.search);
    const token = sp.get("token");

    if (!token) {
      setIsInvalid(true);
      return;
    }

    try {
      const decoded: {
        attendanceId: string;
        classroomId: string;
        exp: number;
      } = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000);

      if (decoded.exp < now) {
        setIsInvalid(true);
        return;
      }

      setClassroomId(decoded.classroomId);
      setAttendanceId(decoded.attendanceId);
      setIsInvalid(false);
    } catch (err) {
      console.error("Invalid token:", err);
      setIsInvalid(true);
    }

    setParamsLoaded(true);
  }, []);

  // Fetch students
  useEffect(() => {
    if (!classroomId) return;

    const fetchStudents = async () => {
      try {
        const response = await axiosInstance.get(
          `attendance/only/${classroomId}`
        );
        setStudents(response.data.classroom.ClassroomStudents || []);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      }
    };

    fetchStudents();
  }, [classroomId]);

  // Camera handling
  useEffect(() => {
    if (step !== 2) return;

    startCamera(videoRef, (msg) => toast.error(msg), streamRef);

    return () => stopCamera(streamRef);
  }, [step]);

  const getCurrentTime = () =>
    new Date().toLocaleTimeString("mn-MN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getCurrentDate = () =>
    new Date().toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // Handle recognition + attendance
  const checkStudent = async () => {
    setIsProcessing(true);
    try {
      const res = await axiosInstance.get(
        `attendance/check/${attendanceId}/${studentId}`
      );

      if (res.data.message === "Student can attend") {
        toast.success("Та ирцээ бүртгүүлэх боломжтой.");
        setIsProcessing(false);
        setStep(2);
      } else {
        setIsProcessing(false);
        toast.error(res.data.message);
        setStep(1);
      }
    } catch (error: any) {
      setIsProcessing(false);
      toast.error(error.response.data.message);
      setStep(1);
    }
  };

  const handleRecognitionComplete = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // 1️⃣ Capture screenshot
      if (!webcamRef.current) {
        toast.error("Камер бэлэн биш байна.");
        return;
      }
      const shot = webcamRef.current.getScreenshot();
      if (!shot) {
        toast.error("Царай авахад алдаа гарлаа.");
        return;
      }

      setSrc(shot);
      setIsCapturing(true);

      // 2️⃣ Get location
      const location = await getLocation();

      // 3️⃣ Face recognition
      const verified = await captureAndVerify(
        shot,
        `${PYTHON_BACKEND_URL}student/attend`,
        {
          studentId,
          classroom_students: students,
          latitude: location.latitude,
          longitude: location.longitude,
        },
        setMessage,
        (name) =>
          toast.success(
            `Сайн байна уу, ${name || "Оюутан"}! Царай амжилттай танигдлаа.`
          )
      );

      if (verified == false) {
        return toast.error(message);
      }
      setMessage("");
      // 4️⃣ Record attendance
      const attendanceRecorded = await recordAttendance(
        attendanceId!,
        studentId,
        setMessage,
        location.latitude,
        location.longitude
      );

      if (attendanceRecorded === false) {
        return toast.error(message);
      }

      stopCamera(streamRef);
      setStep(3);
      setTimeout(() => {
        router.push("/");
      }, 5000);
    } catch (error) {
      console.error(error);
      toast.error("Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setIsProcessing(false);
      setIsCapturing(false);
    }
  };

  if (isInvalid) return <QRError />;
  if (!paramsLoaded)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Түр хүлээнэ үү...
      </div>
    );
  if (!attendanceId)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Attendance ID олдсонгүй.
      </div>
    );

  const steps = [
    { id: 1, label: "Оюутны ID", icon: User },
    { id: 2, label: "Царай таних", icon: Camera },
    { id: 3, label: "Амжилттай", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-center" />

      {/* Progress */}
      <div className="">
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
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Оюутны ID-гaa оруулна уу
              </h2>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="24LP0000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
              />
              <button
                disabled={!studentId.trim() || isProcessing}
                onClick={() => checkStudent()}
                className="w-full bg-slate-700 text-white py-3 px-4 rounded-lg font-medium 
             hover:bg-slate-800 disabled:bg-gray-300 disabled:cursor-not-allowed 
             transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                    Шалгагдаж байна...
                  </>
                ) : (
                  "Үргэлжлүүлэх"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Царай таних
              </h2>
              <p className="text-gray-600">
                Камерт луу хараад <b>царай таних</b> товч дарна уу
              </p>
            </div>

            <div className="flex flex-col items-center space-y-4 overflow-hidden rounded-full py-2">
              {src !== "" && isCapturing ? (
                <div className="relative w-60 h-60 flex items-center justify-center rounded-full">
                  <img
                    className="rounded-full w-55 h-55 object-cover blur-sm"
                    src={src}
                    alt="Captured"
                  />
                  <div className="absolute w-60 h-60 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin rounded-full"></div>
                </div>
              ) : (
                <div className="relative w-60 h-60">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={1}
                    videoConstraints={{ facingMode: "user" }}
                    className="w-full h-full rounded-full object-cover border-2 border-gray-300 -scale-x-100"
                  />
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
                      transform="scale(1.2) translate(-25 -0.1)"
                      d="M72.2,95.9c0,5.5,4.1,9.9,9.1,9.9c0,0,0.1,0,0.2,0c1.9,26.2,22,52.4,46.5,52.4c24.5,0,44.6-26.2,46.5-52.4
                      c0,0,0.1,0,0.2,0c5,0,9.1-4.5,9.1-9.9c0-4.1-2.2-7.5-5.4-9.1c1.9-5.9,2.8-12.2,2.8-18.8C181.2,36,157.4,10,128,10
                      c-29.4,0-53.2,26-53.2,58.1c0,6.6,1,12.9,2.9,18.8C74.4,88.4,72.2,91.8,72.2,95.9z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {!isProcessing && (
              <button
                onClick={() => handleRecognitionComplete()}
                className="w-full bg-slate-700 text-white py-2 px-4 rounded-lg font-medium hover:bg-slate-800 transition-colors mt-2"
              >
                Царай таних
              </button>
            )}
          </div>
        )}

        {/* Step 3 */}
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
