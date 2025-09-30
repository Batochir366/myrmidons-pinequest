"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Toaster } from "sonner";
import { axiosInstance } from "@/lib/utils";
import AttendanceControlPanel from "@/components/AttendanceControlPanel";
import QrAndAttendance from "@/components/QrAndAttendance";
import { PiPProviderHandle } from "@/utils/PiPProvider";

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
  faceImage?: string | null;
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
  handleSave: (newSec: number) => void;
  start: () => void;
  stop: () => void;
  startQRTimer: (attendanceId: string) => void;
  pollAttendanceData: (attendanceId: string) => void;
  pipProviderRef: React.RefObject<PiPProviderHandle>;
  pipActive: boolean;
  qrSvg: string;
  setQrSvg: React.Dispatch<React.SetStateAction<string>>;
  totalStudents: number
}

export function QRControlCenter({
  students,
  setStudents,
  countdown,
  qrData,
  qrSec,
  running,
  loading,
  selectedClassroomId,
  selectedLectureName,
  onStop,
  onClassroomChange,
  isRestoringSession = false,
  handleSave,
  start,
  stop,
  pipProviderRef,
  pipActive,
  setQrSvg,
  totalStudents
}: QRControlCenterProps) {
  const [teacherId, setTeacherId] = useState("");
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [joinLinkQr, setJoinLinkQr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);

  useEffect(() => {
    const storedId = localStorage.getItem("teacherId");
    if (storedId) setTeacherId(storedId);
  }, []);

  useEffect(() => {
    if (!teacherId) return;

    axiosInstance
      .get(`teacher/only-classrooms/${teacherId}`)
      .then((res) => {
        const fetchedClassrooms = res.data.classrooms || [];
        setClassrooms(fetchedClassrooms);
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

  const generateJoinLinkQr = (link: string) => {
    QRCode.toDataURL(link, { width: 128 })
      .then(setJoinLinkQr)
      .catch(() => setJoinLinkQr(null));
  };

  const handleClassroomChange = async (id: string) => {
    if (running) onStop();
    const classroom = classrooms.find((c) => c._id === id);
    const lectureName = classroom?.lectureName || "";
    onClassroomChange(id, lectureName);

    if (classroom) {
      classroom.joinLink
        ? generateJoinLinkQr(classroom.joinLink)
        : setJoinLinkQr(null);
    } else {
      setJoinLinkQr(null);
    }

    try {
      const res = await axiosInstance.get(`teacher/classroom-students/${id}`);

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
        handlesave={handleSave}
      />

      {running && qrData && (
        <QrAndAttendance
          pipActive={pipActive}
          pipProviderRef={pipProviderRef}
          qrData={qrData}
          open={open}
          setOpen={setOpen}
          students={students}
          countdown={countdown}
          qrSec={qrSec}
          setQrSvg={setQrSvg}
          totalStudents={totalStudents}
        />
      )}
    </div>
  );
}
