"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import jwtEncode from "jwt-encode";
import { toast, Toaster } from "sonner";

import { getLocation } from "@/utils/getLocation";
import { axiosInstance, axiosInstanceFront } from "@/lib/utils";
import AttendanceControlPanel from "@/components/AttendanceControlPanel";
import QrAndAttendance from "@/components/QrAndAttendance";

// -----------------------------
// Interfaces
// -----------------------------

interface Classroom {
  _id: string;
  lectureName: string;
  joinLink?: string;
}

interface Student {
  _id: string;
  studentName: string;
  studentId: string;
  time: string;
}

interface QRControlCenterProps {
  attendanceId: string | null;
  setAttendanceId: React.Dispatch<React.SetStateAction<string | null>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  countdown: number;
  setCountdown: React.Dispatch<React.SetStateAction<number>>;
  qrData: string | null;
  qrSec: number;
  setQrSec: React.Dispatch<React.SetStateAction<number>>;
  setQrData: React.Dispatch<React.SetStateAction<string | null>>;
  qrImage: string | null;
  setQrImage: React.Dispatch<React.SetStateAction<string | null>>;
  running: boolean;
  setRunning: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  selectedClassroomId: string;
  setSelectedClassroomId: React.Dispatch<React.SetStateAction<string>>;
  selectedLectureName: string;
  setSelectedLectureName: React.Dispatch<React.SetStateAction<string>>;
  timerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  pollRef: React.MutableRefObject<NodeJS.Timeout | null>;
  onStart: () => void;
  onStop: () => void;
  onClassroomChange: (id: string, lectureName: string) => void;
  isRestoringSession?: boolean;
}

export function QRControlCenter({
  attendanceId,
  setAttendanceId,
  students,
  setStudents,
  countdown,
  setCountdown,
  qrData,
  setQrData,
  qrImage,
  setQrImage,
  running,
  setRunning,
  loading,
  setLoading,
  selectedClassroomId,
  setSelectedClassroomId,
  selectedLectureName,
  setSelectedLectureName,
  timerRef,
  pollRef,
  onStart,
  onStop,
  onClassroomChange,
  isRestoringSession = false,
}: QRControlCenterProps) {
  // -----------------------------
  // State Definitions (Component-specific only)
  // -----------------------------
  const [teacherId, setTeacherId] = useState("");
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [joinLinkQr, setJoinLinkQr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [classroomStudents, setClassroomStudents] = useState<Student[]>([]);

  // QR шинэчлэх секунд - багшаас тохируулсан эсвэл анхны утга
  const [qrSec, setQrSec] = useState(5);

  // -----------------------------
  // Storage Keys
  // -----------------------------
  const QR_SEC_STORAGE_KEY = "qr_generation_seconds";

  // -----------------------------
  // Effects
  // -----------------------------

  // Load teacher ID from localStorage
  useEffect(() => {
    const storedId = localStorage.getItem("teacherId");
    if (storedId) setTeacherId(storedId);
  }, []);

  // Load QR generation time from localStorage on component mount
  useEffect(() => {
    const storedQrSec = localStorage.getItem(QR_SEC_STORAGE_KEY);
    if (storedQrSec) {
      const parsedQrSec = parseInt(storedQrSec, 10);
      if (!isNaN(parsedQrSec) && parsedQrSec > 0) {
        setQrSec(parsedQrSec);
      }
    }
  }, []);

  // Save QR generation time to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(QR_SEC_STORAGE_KEY, qrSec.toString());
  }, [qrSec]);

  // Fetch classrooms on teacherId load
  useEffect(() => {
    if (!teacherId) return;

    axiosInstance
      .get(`teacher/only-classrooms/${teacherId}`)
      .then((res) => {
        const fetchedClassrooms = res.data.classrooms || [];
        setClassrooms(fetchedClassrooms);

        // If restoring session and we have a selected classroom, generate join link QR
        if (isRestoringSession && selectedClassroomId && !sessionRestored) {
          const classroom = fetchedClassrooms.find(
            (c: Classroom) => c._id === selectedClassroomId
          );
          if (classroom?.joinLink) {
            generateJoinLinkQr(classroom.joinLink);
          }
          setSessionRestored(true);
        }
      })
      .catch((err) => {
        console.error("Error fetching classrooms:", err);
        alert("Ангийн мэдээлэл авахад алдаа гарлаа");
      });
  }, [teacherId, selectedClassroomId, isRestoringSession, sessionRestored]);

  // Resume timers if session is being restored
  useEffect(() => {
    if (
      isRestoringSession &&
      running &&
      attendanceId &&
      !timerRef.current &&
      !pollRef.current
    ) {
      console.log("Resuming timers for restored session...");
      startQRTimer(attendanceId);

      // Resume polling
      pollRef.current = setInterval(
        () => pollAttendanceData(attendanceId),
        2000
      );

      // Generate initial QR if we don't have one
      if (!qrImage || !qrData) {
        generateQr(attendanceId);
      }
    }
  }, [isRestoringSession, running, attendanceId, qrImage, qrData, qrSec]);

  // QR timer нь qrSec өөрчлөгдөхөд дахин эхлүүлэх
  const startQRTimer = (attendanceId: string) => {
    // Хуучин timer-ийг зогсоох
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Шинэ countdown тохируулах
    setCountdown(qrSec);

    // Шинэ timer эхлүүлэх
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          generateQr(attendanceId);
          return qrSec; // qrSec ашиглах
        }
        return prev - 1;
      });
    }, 1000);
  };

  // qrSec өөрчлөгдөхөд timer дахин эхлүүлэх (зөвхөн running үед)
  useEffect(() => {
    if (running && attendanceId) {
      startQRTimer(attendanceId);
    }
  }, [qrSec, running, attendanceId]);

  // -----------------------------
  // QR & Attendance Logic
  // -----------------------------

  const pollAttendanceData = (attendanceId: string) => {
    axiosInstance
      .get(`attendance/live/${attendanceId}`)
      .then((res) => {
        const attendingStudents = res.data.attendance?.attendingStudents || [];

        setStudents(
          attendingStudents.map((s: any) => ({
            _id: s._id,
            studentName: s.studentName,
            studentId: s.studentId,
            time: s.time || new Date().toISOString(),
          }))
        );
      })
      .catch((err) => console.error("Error polling attendance data:", err));
  };

  const generateJoinLinkQr = (link: string) => {
    QRCode.toDataURL(link, { width: 128 })
      .then(setJoinLinkQr)
      .catch(() => setJoinLinkQr(null));
  };

  const generateQr = (attendanceId: string) => {
    const expiresAt = Math.floor((Date.now() + qrSec * 1000) / 1000); // qrSec ашиглах

    const payload = {
      attendanceId,
      classroomId: selectedClassroomId,
      exp: expiresAt,
    };

    const secret = "FACE";
    const token = jwtEncode(payload, secret);
    const url = `${axiosInstanceFront}student?token=${token}`;

    setQrData(url);

    QRCode.toDataURL(url, { width: 256 })
      .then(setQrImage)
      .catch((err) => console.error("Error generating QR code:", err));
  };

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleClassroomChange = async (id: string) => {
    if (running) onStop();

    const classroom = classrooms.find((c) => c._id === id);
    const lectureName = classroom?.lectureName || "";

    // Update parent and local state
    onClassroomChange(id, lectureName);

    if (classroom) {
      classroom.joinLink
        ? generateJoinLinkQr(classroom.joinLink)
        : setJoinLinkQr(null);
    } else {
      setJoinLinkQr(null);
    }

    // Fetch students for this classroom to check if empty
    try {
      const res = await axiosInstance.get(`/teacher/classroom-students/${id}`);

      if (res.data.empty) {
        setStudents([]);
      } else {
        setStudents(res.data.students || []);
      }
    } catch (error) {
      console.error("Error fetching classroom students:", error);
      alert("Оюутнуудыг авахад алдаа гарлаа");
    }
  };

  // Enhanced QR seconds handler with validation
  const handleQrSecChange = (newQrSec: number) => {
    // Validate the input
    if (isNaN(newQrSec) || newQrSec < 1 || newQrSec > 300) {
      toast.error("QR шинэчлэх хугацаа 1-300 секундын хооронд байх ёстой!");
      return;
    }

    setQrSec(newQrSec);

    if (running && attendanceId) {
      console.log(
        `QR interval changed to ${newQrSec} seconds, restarting timer...`
      );
      startQRTimer(attendanceId);
    }

    toast.success(`QR шинэчлэх хугацаа ${newQrSec} секунд болж өөрчлөгдлөө`);
  };

  const start = async () => {
    if (running || !selectedClassroomId) {
      toast.error("Ангийг сонгоно уу!");
      return;
    }

    if (students.length === 0) {
      toast.error("Энэ ангид оюутан байхгүй тул ирц эхлүүлэх боломжгүй байна!");
      return;
    }

    setLoading(true);

    try {
      const { latitude, longitude } = await getLocation();

      const res = await axiosInstance.post("teacher/create-attendance", {
        classroomId: selectedClassroomId,
        latitude,
        longitude,
      });

      const { _id } = res.data;

      if (!_id) throw new Error("Attendance ID алга");

      setAttendanceId(_id);
      setStudents([]);
      generateQr(_id);

      setRunning(true);
      onStart(); // Notify parent

      // QR Timer эхлүүлэх
      startQRTimer(_id);

      // Poll attendance data - managed by parent's refs
      pollRef.current = setInterval(() => pollAttendanceData(_id), 2000);

      toast.success(`Ирц эхлэлээ! QR ${qrSec} секунд тутамд шинэчлэгдэнэ.`);
    } catch (err) {
      console.error("Error creating attendance:", err);
      alert("Ирц үүсгэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const stop = async () => {
    if (!attendanceId) return;

    try {
      await axiosInstance.put("attendance/end", { attendanceId });
      onStop();
      toast.success("Ирц амжилттай дууслаа!");
    } catch (err) {
      console.error("Error ending attendance:", err);
      alert("Ирц дуусгахад алдаа гарлаа");
    }
  };

  // -----------------------------
  // Render
  // -----------------------------

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8 p-4 sm:p-6">
      <Toaster position="bottom-right" />
      <AttendanceControlPanel
        classrooms={classrooms}
        selectedClassroomId={selectedClassroomId}
        selectedLectureName={selectedLectureName}
        loading={loading}
        running={running}
        joinLinkQr={joinLinkQr}
        onClassroomChange={handleClassroomChange}
        start={start}
        stop={stop}
        qrSec={qrSec}
        onQrSecChange={handleQrSecChange}
      />

      {running && qrData && qrImage && (
        <QrAndAttendance
          qrImage={qrImage}
          qrData={qrData}
          open={open}
          setOpen={setOpen}
          students={students}
          countdown={countdown}
          qrSec={qrSec} // Pass qrSec to QrAndAttendance for PiP updates
        />
      )}
    </div>
  );
}
