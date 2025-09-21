"use client";

import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import jwtEncode from "jwt-encode";
import { getLocation } from "@/utils/getLocation";
import { axiosInstance, axiosInstanceFront } from "@/lib/utils";
import AttendanceControlPanel from "./AttendanceControlPanel";
import QrAndAttendance from "./QrAndAttendance";

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

export function QRControlCenter() {
  const [teacherId, setTeacherId] = useState("");
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [selectedLectureName, setSelectedLectureName] = useState("");

  const [qrData, setQrData] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [joinLinkQr, setJoinLinkQr] = useState<string | null>(null);

  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [countdown, setCountdown] = useState(5);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load teacherId
  useEffect(() => {
    const storedId = localStorage.getItem("teacherId");
    if (storedId) setTeacherId(storedId);
  }, []);

  // Fetch classrooms
  useEffect(() => {
    if (!teacherId) return;

    axiosInstance
      .get(`teacher/only-classrooms/${teacherId}`)
      .then((res) => setClassrooms(res.data.classrooms || []))
      .catch((err) => {
        console.error("Error fetching classrooms:", err);
        alert("Ангийн мэдээлэл авахад алдаа гарлаа");
      });
  }, [teacherId]);

  useEffect(() => stopTimer, []);

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

  // Generate join link QR
  const generateJoinLinkQr = (link: string) => {
    QRCode.toDataURL(link, { width: 128 })
      .then((dataUrl) => setJoinLinkQr(dataUrl))
      .catch(() => setJoinLinkQr(null));
  };

  // Generate attendance QR (JWT)
  const generateQr = (attendanceId: string) => {
    const expiresAt = Date.now() + 5000;
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
      .then((dataUrl) => setQrImage(dataUrl))
      .catch((err) => console.error("Error generating QR code:", err));
  };

  const onClassroomChange = (id: string) => {
    if (running) stopTimer();
    setSelectedClassroomId(id);

    const classroom = classrooms.find((c) => c._id === id);
    if (classroom) {
      setSelectedLectureName(classroom.lectureName);
      classroom.joinLink
        ? generateJoinLinkQr(classroom.joinLink)
        : setJoinLinkQr(null);
    } else {
      setSelectedLectureName("");
      setJoinLinkQr(null);
    }
  };

  const start = async () => {
    if (running || !selectedClassroomId) return alert("Ангийг сонгоно уу");
    setLoading(true);

    try {
      const { latitude, longitude } = await getLocation();
      const res = await axiosInstance.post(`teacher/create-attendance`, {
        classroomId: selectedClassroomId,
        latitude,
        longitude,
      });

      const { _id } = res.data;
      if (!_id) throw new Error("Attendance ID алга");

      setAttendanceId(_id);
      setStudents([]);
      generateQr(_id);

      setCountdown(5);
      setRunning(true);

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            generateQr(_id);
            return 5;
          }
          return prev - 1;
        });
      }, 1000);

      pollRef.current = setInterval(() => pollAttendanceData(_id), 2000);
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
      await axiosInstance.put(`attendance/end`, { attendanceId });
      stopTimer();
    } catch (err) {
      console.error("Error ending attendance:", err);
      alert("Ирц дуусгахад алдаа гарлаа");
    }
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    timerRef.current = null;
    pollRef.current = null;

    setRunning(false);
    setCountdown(5);
    setQrData(null);
    setQrImage(null);
    setAttendanceId(null);
    setStudents([]);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8 p-4 sm:p-6">
      <AttendanceControlPanel
        classrooms={classrooms}
        selectedClassroomId={selectedClassroomId}
        selectedLectureName={selectedLectureName}
        loading={loading}
        running={running}
        joinLinkQr={joinLinkQr}
        onClassroomChange={onClassroomChange}
        start={start}
        stop={stop}
      />

      {running && qrData && qrImage && (
        <QrAndAttendance
          qrImage={qrImage}
          qrData={qrData}
          countdown={countdown}
          open={open}
          setOpen={setOpen}
          students={students}
        />
      )}
    </div>
  );
}
