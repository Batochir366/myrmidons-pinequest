"use client";

import React, { useState, useRef, useEffect } from "react";
import { User, Camera, CheckCircle, ArrowRight, Eye } from "lucide-react";
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
import { Toaster } from "sonner";

type Student = {
  studentId: string;
  embedding: number[];
  _id: string;
};

const AttendanceSystem: React.FC = () => {
  const [studentId, setStudentId] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(2);
  const [message, setMessage] = useState("");
  const [recognitionProgress, setRecognitionProgress] = useState(0);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isRecordingAttendance, setIsRecordingAttendance] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const webcamRef = useRef<Webcam>(null); // for webcam
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [isInvalid, setIsInvalid] = useState(false);
  const [paramsLoaded, setParamsLoaded] = useState(false);
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [src, setSrc] = useState<string>("");
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // useEffect(() => {
  //   if (typeof window === "undefined") return;

  //   const handleParams = () => {
  //     const sp = new URLSearchParams(window.location.search);
  //     const tokenValue = sp.get("token");

  //     if (!tokenValue) {
  //       setIsInvalid(true);
  //       return;
  //     }

  //     try {
  //       const decoded: {
  //         attendanceId: string;
  //         classroomId: string;
  //         exp: number;
  //       } = jwtDecode(tokenValue);

  //       const nowInSeconds = Math.floor(Date.now() / 1000);

  //       if (decoded.exp < nowInSeconds) {
  //         setIsInvalid(true);
  //         return;
  //       }

  //       setToken(tokenValue);
  //       setClassroomId(decoded.classroomId);
  //       setAttendanceId(decoded.attendanceId);
  //       setExpiresAt(decoded.exp * 1000);
  //       setIsInvalid(false);
  //     } catch (err) {
  //       console.error("Invalid token:", err);
  //       setIsInvalid(true);
  //     }

  //     setParamsLoaded(true);
  //   };

  //   handleParams();
  //   window.addEventListener("popstate", handleParams);
  //   return () => window.removeEventListener("popstate", handleParams);
  // }, []);

  console.log(classroomId, attendanceId);

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

  // Enhanced camera useEffect with better cleanup
  useEffect(() => {
    let isMounted = true;

    if (step === 2 && isMounted) {
      startCamera(videoRef, setMessage, streamRef);
    }

    return () => {
      isMounted = false;
      stopCamera(streamRef);
    };
  }, [step]);

  const handleRecognitionComplete = async () => {
    // Enhanced guard: Prevent multiple calls with processing lock
    if (isRecognizing || isRecordingAttendance || isProcessing) {
      console.log(
        "Recognition, attendance, or processing already in progress, skipping..."
      );
      return;
    }

    // Set processing lock immediately
    setIsProcessing(true);

    try {
      // Handler for ONLY face recognition success from Python
      const onFaceRecognitionSuccess = async (name?: string) => {
        console.log("✅ Face recognition successful from Python:", name);

        // Check if we're still processing to prevent duplicate calls
        if (isRecordingAttendance) {
          console.log(
            "Attendance already recording, ignoring duplicate success"
          );
          return;
        }

        // Show face recognition success message
        setMessage(
          `Сайн байна уу, ${name || "Оюутан"}! Царай амжилттай танигдлаа.`
        );

        // Small delay to show recognition success
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Now start attendance recording process
        await handleAttendanceRecording(name);
      };

      // Separate function for attendance recording
      const handleAttendanceRecording = async (studentName?: string) => {
        // Additional guard for attendance recording
        if (isRecordingAttendance) {
          console.log("Attendance recording already in progress, skipping");
          return;
        }

        console.log("🎯 Starting attendance recording process");

        setIsRecordingAttendance(true);
        setMessage("Ирц бүртгэж байна...");

        try {
          const location = await getLocation();
          const attendanceRecorded = await recordAttendance(
            attendanceId!,
            studentId,
            setMessage,
            location.latitude,
            location.longitude
          );

          if (attendanceRecorded) {
            console.log("✅ Attendance recording successful");

            // Final success message
            setMessage(
              `Сайн байна уу, ${
                studentName || "Оюутан"
              }! Ирц амжилттай бүртгэгдлээ.`
            );

            stopCamera(streamRef);
            setStep(3);
          } else {
            console.log("❌ Attendance recording failed");
            setMessage("Ирц бүртгэхэд алдаа гарлаа.");
          }
        } catch (error) {
          console.error("❌ Error in attendance recording:", error);
          setMessage(
            "Байршлын мэдээллийг авах боломжгүй байна. Байршлын зөвшөөрөл өгнө үү."
          );
        } finally {
          setIsRecordingAttendance(false);
        }
      };

      const location = await getLocation();
      console.log(
        "🚀 Starting attendance verification with students:",
        students.length
      );

      // First check if student already attended (Node.js check)
      try {
        const attendanceCheckResponse = await axiosInstance.get(
          `/attendance/check/${attendanceId}/${studentId}`
        );
        if (attendanceCheckResponse.data.already_attended == false) {
          const verified = await captureAndVerify(
            videoRef,
            canvasRef,
            `${PYTHON_BACKEND_URL}student/attend`,
            {
              studentId,
              classroom_students: students,
              latitude: location.latitude,
              longitude: location.longitude,
            },
            setMessage,
            setIsRecognizing,
            setRecognitionProgress,
            onFaceRecognitionSuccess
          );
          if (!verified) {
            console.log(
              "❌ Face recognition failed - message should be displayed"
            );
            setIsRecognizing(false);
            setRecognitionProgress(0);
            // Note: setMessage is already called inside captureAndVerify for error cases
          }
        }
        // If we get here, student can attend (200 response)
        console.log(
          "✅ Attendance check passed, proceeding with face recognition"
        );
      } catch (error: any) {
        // Handle expected 409 (already attended) vs unexpected errors
        if (error.response?.status === 409) {
          // This is expected - student already attended
          const errorMessage =
            error.response.data?.message ||
            "Та аль хэдийн ирц бүртгэгдсэн байна.";
          console.log("ℹ️ Student already attended:", errorMessage);
          setMessage(errorMessage);
          setIsRecognizing(false);
          setRecognitionProgress(0);
          return; // Stop here, don't proceed to face recognition
        }

        // Check for other attendance-related error messages
        const errorMessage = error.response?.data?.message || "";
        if (
          errorMessage.includes("бүртгэгдсэн") ||
          errorMessage.includes("ирц") ||
          errorMessage.includes("already")
        ) {
          console.log(
            "ℹ️ Student already attended (by message):",
            errorMessage
          );
          setMessage(errorMessage);
          setIsRecognizing(false);
          setRecognitionProgress(0);
          return;
        }

        // For unexpected errors, log them but continue
        console.error("❌ Unexpected attendance check error:", error.message);
        console.log("Proceeding with face recognition despite check failure");
      }

      console.log(
        "✅ Attendance check passed, proceeding with face recognition"
      );

      // Call captureAndVerify with ONLY face recognition callback
    } catch (error) {
      console.error("❌ Error in handleRecognitionComplete:", error);
      setIsRecognizing(false);
      setRecognitionProgress(0);
      setMessage("Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      // Always release processing lock
      setIsProcessing(false);
    }
  };

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

  const steps = [
    { id: 1, label: "Оюутны ID", icon: User },
    { id: 2, label: "Царай таних", icon: Camera },
    { id: 3, label: "Амжилттай", icon: CheckCircle },
  ];

  // if (isInvalid) {
  //   return <QRError />;
  // }

  // if (!paramsLoaded) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <p className="text-gray-600">Түр хүлээнэ үү...</p>
  //     </div>
  //   );
  // }

  // if (!attendanceId) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
  //       <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
  //         <p className="text-gray-600">Attendance ID олдсонгүй.</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-center" />
      {/* Progress Indicator */}
      <div>
        <div className="max-w-2xl mx-auto pt-4 ">
          <div className="flex items-center justify-between mb-4 relative">
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
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-centers px-4">
        {/* Step 1: Student ID */}
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
              <p className="text-gray-600">
                Камерт луу хараад <b>царай таних</b> товч дарна уу
              </p>
            </div>

            <div className="flex flex-col items-center space-y-4 overflow-hidden rounded-full py-2">
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
                    audio={false}
                    ref={webcamRef} // add a ref for webcam
                    screenshotFormat="image/jpeg"
                    screenshotQuality={1}
                    videoConstraints={{ facingMode: "user" }}
                    className="w-full h-full rounded-full object-cover border-2 border-red-600 -scale-x-100"
                  />
                  {/* SVG overlay */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 256 256"
                    className="absolute inset-0 w-full h-full pointer-events-none mt-2"
                  >
                    <path
                      style={{ stroke: "red" }}
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

            {/* The rest: progress bar / message / buttons, replacing video‑based logic */}
            {(isRecognizing || isRecordingAttendance) && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {isRecordingAttendance ? "Ирц бүртгэж байна" : "Таних явц"}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {isRecordingAttendance ? "..." : `${recognitionProgress}%`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isRecordingAttendance
                        ? "bg-blue-600 animate-pulse"
                        : "bg-slate-700"
                    }`}
                    style={{
                      width: isRecordingAttendance
                        ? "100%"
                        : `${recognitionProgress}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {!isRecognizing &&
              !isRecordingAttendance &&
              !isProcessing &&
              recognitionProgress === 0 &&
              !message && (
                <button
                  onClick={async () => {
                    // When user clicks, take screenshot, set src & isCapturing, then run recognition
                    if (webcamRef.current) {
                      const shot = webcamRef.current.getScreenshot();
                      if (shot) {
                        setSrc(shot);
                        setIsCapturing(true);
                        // maybe small delay so UI shows blur + spinner
                        // Then call your handleRecognitionComplete or a wrapper
                        await handleRecognitionComplete();
                        // after done, set isCapturing(false) if needed
                        setIsCapturing(false);
                      } else {
                        setMessage("Царай авахад алдаа гарлаа.");
                      }
                    }
                  }}
                  className="w-full bg-slate-700 text-white py-2 px-4 rounded-lg font-medium hover:bg-slate-800 transition-colors mt-2"
                >
                  Царай таних
                </button>
              )}

            {!isRecognizing &&
              !isRecordingAttendance &&
              !isProcessing &&
              recognitionProgress === 0 &&
              message &&
              !message.includes("амжилттай") &&
              !message.includes("Сайн байна уу") && (
                <button
                  onClick={() => {
                    setMessage("");
                    setRecognitionProgress(0);
                    setStudentId("");
                    setSrc("");
                    stopCamera(streamRef); // optional
                    setStep(1);
                  }}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Буцаж оюутны ID оруулах
                </button>
              )}

            {message && (
              <p
                className={`mt-4 text-sm text-center ${
                  message.includes("амжилттай") ||
                  message.includes("Сайн байна уу") ||
                  message.includes("байна...")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {message}
              </p>
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
