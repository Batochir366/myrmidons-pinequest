import { safeFetch } from "../utils/apiUtils";

// Configuration for different backends
const FLASK_BASE_URL =
  process.env.NEXT_PUBLIC_FLASK_API_URL || "http://localhost:5000";
const NODE_BASE_URL = process.env.NEXT_PUBLIC_NODE_API_URL || "";

export const startCamera = async (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  setMessage: (msg: string) => void,
  streamRef: React.MutableRefObject<MediaStream | null>
): Promise<void> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
    }
  } catch (error) {
    console.error("Camera access failed:", error);
    setMessage("Камерт хандахад алдаа гарлаа. Камерын зөвшөөрөл шалгана уу.");
    throw error;
  }
};

export const stopCamera = (
  streamRef: React.MutableRefObject<MediaStream | null>
): void => {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }
};

// Convert video frame to base64 for Flask API
const captureImageAsBase64 = async (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
): Promise<string> => {
  if (!videoRef.current || !canvasRef.current) {
    throw new Error("Video or canvas element not found");
  }

  const canvas = canvasRef.current;
  const video = videoRef.current;
  const context2d = canvas.getContext("2d");

  if (!context2d) {
    throw new Error("Canvas context not available");
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context2d.drawImage(video, 0, 0);

  // Convert to base64
  return canvas.toDataURL("image/jpeg", 0.8);
};

// Face verification using Flask backend
const verifyFaceWithFlask = async (
  studentId: string,
  imageBase64: string,
  context: "attendance" | "join"
): Promise<{
  success: boolean;
  verified: boolean;
  name?: string;
  message?: string;
}> => {
  try {
    const response = await fetch(`${FLASK_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentId,
        image_base64: imageBase64,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        verified: false,
        message: data.message || "Face verification failed",
      };
    }

    return {
      success: data.success || false,
      verified: data.verified || false,
      name: data.name,
      message: data.message,
    };
  } catch (error) {
    console.error("Flask API error:", error);
    return {
      success: false,
      verified: false,
      message: "Network error connecting to face recognition service",
    };
  }
};

// Check if student is in classroom (Node.js backend)
const checkStudentInClassroom = async (
  attendanceId: string,
  studentId: string
): Promise<{
  isInClassroom: boolean;
  message?: string;
  joinLink?: string;
  lectureName?: string;
}> => {
  try {
    const url = new URL(`${NODE_BASE_URL}/student/check/${studentId}`);
    url.searchParams.append("attendanceId", attendanceId); // Optional, if needed

    const result = await safeFetch<{
      classroomId?: string;
      classroomName?: string;
      message?: string;
    }>(url.toString(), {
      method: "GET",
    });

    if (!result.success) {
      return {
        isInClassroom: false,
        message: result.error || "Failed to check classroom membership",
      };
    }

    return {
      isInClassroom: true,
      message: result.data?.message,
      lectureName: result.data?.classroomName,
      joinLink: undefined,
    };
  } catch (error) {
    console.error("Classroom check error:", error);
    return {
      isInClassroom: false,
      message: "Network error checking classroom membership",
    };
  }
};

// Join classroom (Node.js backend)
const joinClassroomWithNode = async (
  classroomId: string,
  studentId: string,
  lectureName?: string,
  studentName?: string
): Promise<{
  success: boolean;
  message?: string;
  alreadyJoined?: boolean;
}> => {
  try {
    const result = await safeFetch<{
      success: boolean;
      message?: string;
      alreadyJoined?: boolean;
    }>(`${NODE_BASE_URL}/api/student/join-classroom`, {
      method: "POST",
      body: JSON.stringify({
        classroomId,
        studentId,
        lectureName,
        studentName,
      }),
    });

    if (!result.success) {
      return {
        success: false,
        message: result.error || "Failed to join classroom",
      };
    }

    return result.data || { success: false };
  } catch (error) {
    console.error("Join classroom error:", error);
    return {
      success: false,
      message: "Network error joining classroom",
    };
  }
};

export const captureAndVerify = async (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  studentId: string,
  setMessage: (msg: string) => void,
  setIsRecognizing: (status: boolean) => void,
  setProgress: (progress: number) => void,
  onSuccess: (name?: string) => Promise<void>,
  context: "attendance" | "join" = "attendance"
): Promise<boolean> => {
  try {
    setIsRecognizing(true);
    setMessage("Зураг авч байна...");

    // Capture image as base64
    const imageBase64 = await captureImageAsBase64(videoRef, canvasRef);

    setMessage("Царай танилцуулж байна...");

    // Verify face using Flask backend
    const verificationResult = await verifyFaceWithFlask(
      studentId,
      imageBase64,
      context
    );

    if (!verificationResult.success || !verificationResult.verified) {
      const message =
        verificationResult.message || "Царай танигдсангүй. Дахин оролдоно уу.";
      setMessage(message);
      return false;
    }

    // If verification successful, call onSuccess
    await onSuccess(verificationResult.name);
    return true;
  } catch (error) {
    console.error("Face verification error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Царай танихад алдаа гарлаа";
    setMessage(errorMessage);
    return false;
  } finally {
    setIsRecognizing(false);
  }
};

export const recordAttendance = async (
  attendanceId: string,
  studentId: string,
  setMessage: (msg: string) => void
): Promise<boolean> => {
  try {
    setMessage("Ирц бүртгэж байна...");

    const result = await safeFetch<{
      success?: boolean;
      message?: string;
      attendance?: any;
    }>(`${NODE_BASE_URL}/api/add-student-attendance`, {
      method: "POST",
      body: JSON.stringify({
        attendanceId,
        studentId,
      }),
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to record attendance");
    }

    if (result.data?.message) {
      setMessage(result.data.message);
      return !result.data.message.includes("алдаа"); // Return true if no error in message
    }

    setMessage("Ирц амжилттай бүртгэгдлээ");
    return true;
  } catch (error) {
    console.error("Attendance recording error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Ирц бүртгэхэд алдаа гарлаа";
    setMessage(errorMessage);
    return false;
  }
};

export const simulateRecognition = (
  setIsRecognizing: (status: boolean) => void,
  setProgress: React.Dispatch<React.SetStateAction<number>>,
  onComplete: () => void
): void => {
  setIsRecognizing(true);
  setProgress(0);

  const interval = setInterval(() => {
    setProgress((prev: number) => {
      const next = prev + 10;
      if (next >= 100) {
        clearInterval(interval);
        setTimeout(onComplete, 500); // Small delay before calling complete
        return 100;
      }
      return next;
    });
  }, 200);
};

// Export functions for the join flow
export const validateStudentForAttendance = async (
  attendanceId: string,
  studentId: string
): Promise<{
  isValid: boolean;
  message?: string;
  joinLink?: string;
  lectureName?: string;
}> => {
  const result = await checkStudentInClassroom(attendanceId, studentId);
  return {
    isValid: result.isInClassroom,
    message: result.message,
    joinLink: result.joinLink,
    lectureName: result.lectureName,
  };
};

export const joinClassroom = async (
  classroomId: string,
  studentId: string,
  lectureName?: string,
  studentName?: string
): Promise<{
  success: boolean;
  message?: string;
  alreadyJoined?: boolean;
}> => {
  return await joinClassroomWithNode(
    classroomId,
    studentId,
    lectureName,
    studentName
  );
};
