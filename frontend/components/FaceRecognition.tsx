"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Eye, ExternalLink } from "lucide-react";
import {
  captureAndVerify,
  simulateRecognition,
  recordAttendance,
  validateStudentForAttendance,
} from "@/utils/attendanceUtils";

interface FaceRecognitionStepProps {
  studentId: string;
  attendanceId: string;
  message: string;
  setMessage: (msg: string) => void;
  onSuccess: () => void;
  context?: "attendance" | "join";
  classroomId?: string;
}

export const FaceRecognitionStep: React.FC<FaceRecognitionStepProps> = ({
  studentId,
  attendanceId,
  message,
  setMessage,
  onSuccess,
  context = "attendance",
  classroomId,
}) => {
  const [recognitionProgress, setRecognitionProgress] = useState<number>(0);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [isRecordingAttendance, setIsRecordingAttendance] =
    useState<boolean>(false);
  const [cameraStarted, setCameraStarted] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [showJoinPrompt, setShowJoinPrompt] = useState<boolean>(false);
  const [joinLink, setJoinLink] = useState<string>("");
  const [lectureName, setLectureName] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef<boolean>(true);

  const handleVideoPlay = useCallback(async () => {
    if (!videoRef.current || !streamRef.current) return;

    try {
      if (videoRef.current.readyState >= 2) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        if (mountedRef.current) {
          setCameraStarted(true);
          setIsInitializing(false);
        }
      }
    } catch (error) {
      console.error("Video play failed:", error);
      if (mountedRef.current) {
        setMessage("Видео тоглуулахад алдаа гарлаа");
        setIsInitializing(false);
      }
    }
  }, [setMessage]);

  useEffect(() => {
    mountedRef.current = true;
    let timeoutId: NodeJS.Timeout;

    const initCamera = async () => {
      if (!mountedRef.current) return;

      try {
        setIsInitializing(true);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });

        if (!mountedRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadedmetadata", handleVideoPlay);
          videoRef.current.addEventListener("canplay", handleVideoPlay);

          timeoutId = setTimeout(() => {
            if (mountedRef.current && !cameraStarted) {
              setCameraStarted(true);
              setIsInitializing(false);
            }
          }, 3000);
        }
      } catch (error) {
        console.error("Camera initialization failed:", error);
        if (mountedRef.current) {
          setMessage(
            "Камерт хандахад алдаа гарлаа. Камерын зөвшөөрөл өгнө үү."
          );
          setIsInitializing(false);
        }
      }
    };

    initCamera();

    return () => {
      mountedRef.current = false;
      if (timeoutId) clearTimeout(timeoutId);

      if (videoRef.current) {
        videoRef.current.removeEventListener("loadedmetadata", handleVideoPlay);
        videoRef.current.removeEventListener("canplay", handleVideoPlay);
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [handleVideoPlay, cameraStarted, setMessage]);

  const validateAndStartRecognition = async (): Promise<void> => {
    if (!cameraStarted || isInitializing) {
      setMessage("Камер бэлэн болохыг хүлээнэ үү");
      return;
    }

    // For attendance context, validate if student is in classroom
    if (context === "attendance") {
      try {
        const validation = await validateStudentForAttendance(
          attendanceId,
          studentId
        );

        if (!validation.isValid) {
          setMessage(validation.message || "Та эхлээд хичээлд нэгдэнэ үү");

          if (validation.joinLink) {
            setJoinLink(validation.joinLink);
            setLectureName(validation.lectureName || "");
            setShowJoinPrompt(true);
          }
          return;
        }
      } catch (error) {
        console.error("Error validating student:", error);
        setMessage("Оюутны мэдээлэл шалгахад алдаа гарлаа");
        return;
      }
    }

    // Proceed with face recognition
    simulateRecognition(
      setIsRecognizing,
      setRecognitionProgress,
      handleRecognitionComplete
    );
  };

  const handleRecognitionComplete = async (): Promise<void> => {
    const onSuccessCallback = async (name?: string): Promise<void> => {
      setMessage(
        `Сайн байна уу, ${name || "Оюутан"}! Царай амжилттай танигдлаа.`
      );

      if (context === "attendance") {
        setIsRecordingAttendance(true);

        try {
          const attendanceRecorded = await recordAttendance(
            attendanceId,
            studentId,
            setMessage
          );

          if (attendanceRecorded) {
            setMessage(
              `Сайн байна уу, ${name || "Оюутан"}! Ирц амжилттай бүртгэгдлээ.`
            );
            stopCamera();
            onSuccess();
          }
        } catch (error) {
          console.error("Attendance recording failed:", error);
          setMessage("Ирц бүртгэхэд алдаа гарлаа");
        } finally {
          setIsRecordingAttendance(false);
        }
      } else {
        stopCamera();
        onSuccess();
      }
    };

    try {
      const verified = await captureAndVerify(
        videoRef,
        canvasRef,
        studentId,
        setMessage,
        setIsRecognizing,
        setRecognitionProgress,
        onSuccessCallback,
        context
      );

      if (!verified) {
        setIsRecognizing(false);
        setRecognitionProgress(0);
      }
    } catch (error) {
      console.error("Face verification failed:", error);
      setMessage("Царай таних явцад алдаа гарлаа");
      setIsRecognizing(false);
      setRecognitionProgress(0);
    }
  };

  const stopCamera = (): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Царай таних</h2>
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
              autoPlay={false}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {(isInitializing || !cameraStarted) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
                {isInitializing ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mb-2"></div>
                    <span className="text-xs text-gray-600">
                      Камер эхлүүлж байна...
                    </span>
                  </>
                ) : (
                  <Camera size={48} className="text-gray-400" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Join Prompt for Attendance Context */}
      {showJoinPrompt && context === "attendance" && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-yellow-800 mb-3">
              Та эхлээд "{lectureName}" хичээлд нэгдэнэ үү
            </p>
            {joinLink && (
              <a
                href={joinLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Хичээлд нэгдэх
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
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

      {/* Success Indicator */}
      {recognitionProgress === 100 && !isRecordingAttendance && (
        <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
          <Eye size={18} />
          <span className="font-medium">Таних амжилттай боллоо!</span>
        </div>
      )}

      {/* Recognition Button */}
      {!isRecognizing &&
        !isRecordingAttendance &&
        recognitionProgress === 0 &&
        !showJoinPrompt && (
          <button
            onClick={validateAndStartRecognition}
            disabled={!cameraStarted || isInitializing}
            className="w-full bg-slate-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isInitializing
              ? "Камер эхлүүлж байна..."
              : cameraStarted
              ? "Царай таних"
              : "Камер бэлэн биш"}
          </button>
        )}

      {/* Message Display */}
      {message && !showJoinPrompt && (
        <p
          className={`mt-4 text-sm text-center ${
            message.includes("амжилттай") || message.includes("Сайн байна уу")
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};
