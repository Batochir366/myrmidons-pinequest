"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ChevronDown, Clock, Play, QrCode, Square, Users } from "lucide-react";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

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
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");
  const [selectedLectureName, setSelectedLectureName] = useState("");
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [joinLinkQr, setJoinLinkQr] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [teacherId, setTeacherId] = useState("");

  const timerRef = useRef<number | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem("teacherId");
    if (storedId) {
      setTeacherId(storedId);
    }
  }, []);

  // Fetch classrooms
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        if (!teacherId) return;

        const res = await axios.get(
          `https://myrmidons-pinequest-backend.vercel.app/teacher/${teacherId}/classrooms`
        );

        setClassrooms(res.data.classrooms || []);
      } catch (error) {
        console.error("Error fetching classrooms:", error);
        alert("Ангийн мэдээлэл авахад алдаа гарлаа");
      }
    };

    if (teacherId) {
      fetchClassrooms();
    }
  }, [teacherId]);

  // Poll for real-time attendance updates
  const pollAttendanceData = async (attendanceId: string) => {
    try {
      const res = await axios.get(
        `https://myrmidons-pinequest-backend.vercel.app/teacher/attendance/${attendanceId}/students`
      );

      if (res.data.attendance?.attendingStudents) {
        const attendingStudents = res.data.attendance.attendingStudents;

        // Format students with proper timestamps
        const formattedStudents: Student[] = attendingStudents.map(
          (student: any) => ({
            _id: student._id,
            studentName: student.studentName,
            studentId: student.studentId,
            time: new Date().toISOString(), // Use current time as attendance time
          })
        );

        setStudents(formattedStudents);
      }
    } catch (error) {
      console.error("Error polling attendance data:", error);
    }
  };

  const generateJoinLinkQr = (link: string) => {
    QRCode.toDataURL(link, { width: 128 }, (err, dataUrl) => {
      if (err) {
        console.error("Error generating joinLink QR code:", err);
        setJoinLinkQr(null);
      } else {
        setJoinLinkQr(dataUrl);
      }
    });
  };

  const generateQr = (attendanceId: string) => {
    const token = uuidv4();
    const expiresAt = Date.now() + 5000;

    const url = `https://myrmidons-pinequest-frontend.vercel.app/student?token=${token}&expiresAt=${expiresAt}&attendanceId=${attendanceId}`;

    setQrData(url);

    QRCode.toDataURL(url, { width: 256 }, (err, dataUrl) => {
      if (err) {
        console.error("Error generating QR code:", err);
      } else {
        setQrImage(dataUrl);
      }
    });
  };

  const onClassroomChange = (selectedId: string) => {
    if (running) {
      stopTimer();
    }

    setSelectedClassroomId(selectedId);

    const classroom = classrooms.find((c) => c._id === selectedId);
    if (classroom) {
      setSelectedLectureName(classroom.lectureName);

      if (classroom.joinLink) {
        generateJoinLinkQr(classroom.joinLink);
      } else {
        setJoinLinkQr(null);
      }
    } else {
      setSelectedLectureName("");
      setJoinLinkQr(null);
    }
  };

  const start = async () => {
    if (running) return;
    if (!selectedClassroomId) return alert("Ангийг сонгоно уу");

    try {
      setLoading(true);

      // Create real attendance session
      const res = await axios.post(
        `https://myrmidons-pinequest-backend.vercel.app/teacher/create-attendance`,
        {
          classroomId: selectedClassroomId,
        }
      );

      if (!res.data) throw new Error("Attendance ID алга");
      const { _id } = res.data;
      console.log("Created attendance session:", _id);

      setAttendanceId(_id);
      setStudents([]); // Clear previous students

      // Generate QR with real attendance ID
      generateQr(_id);

      setCountdown(5);
      setRunning(true);

      // Start QR regeneration timer
      timerRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            generateQr(_id);
            return 5;
          }
          return prev - 1;
        });
      }, 1000);

      // Start polling for real attendance data every 2 seconds
      pollRef.current = window.setInterval(() => {
        pollAttendanceData(_id);
      }, 2000);
    } catch (error) {
      console.error("Error creating attendance:", error);
      alert("Ирц үүсгэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const stop = async () => {
    if (!attendanceId) return;

    try {
      // End the attendance session
      await axios.put(
        "https://myrmidons-pinequest-backend.vercel.app/teacher/end-classroom",
        {
          attendanceId: attendanceId,
        }
      );

      stopTimer();
    } catch (error) {
      console.error("Error ending attendance:", error);
      alert("Ирц дуусгахад алдаа гарлаа");
    }
  };

  const stopTimer = () => {
    // Clear QR regeneration timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Clear polling timer
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    setRunning(false);
    setCountdown(5);
    setQrData(null);
    setQrImage(null);
    setAttendanceId(null);
    setStudents([]);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8 p-6">
      {/* Control Panel */}
      <Card className="shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold text-slate-700">
            <QrCode className="w-6 h-6 text-slate-600" />
            Сурагчдын ирцийг хянах QR код үүсгэх
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col lg:flex-row gap-10">
          {/* Left: Controls */}
          <div className="flex flex-col gap-4 w-full lg:w-[300px]">
            <div className="space-y-2">
              <Label
                htmlFor="classroomSelect"
                className="font-semibold text-gray-700"
              >
                <Users className="inline w-4 h-4 mr-1" />
                Ангийг сонгох
              </Label>
              <div className="relative">
                <select
                  id="classroomSelect"
                  className="w-full appearance-none px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white text-gray-800 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-colors"
                  value={selectedClassroomId}
                  onChange={(e) => onClassroomChange(e.target.value)}
                >
                  <option value="">-- Ангийг сонгоно уу --</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom._id} value={classroom._id}>
                      {classroom.lectureName}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <ChevronDown color="gray" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={start}
                disabled={!selectedLectureName || loading || running}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white shadow-md"
              >
                <Play className="w-4 h-4" />
                {loading ? "Хүлээнэ үү..." : "QR үүсгэх"}
              </Button>
              <Button
                disabled={!running}
                onClick={stop}
                variant="destructive"
                className="flex items-center gap-2 shadow-md"
              >
                <Square className="w-4 h-4" />
                Зогсоох
              </Button>
            </div>
          </div>

          {/* Right: Join Link */}
          <div className="flex items-center justify-center flex-1">
            {joinLinkQr ? (
              <div className="flex flex-col items-center">
                <img
                  src={joinLinkQr}
                  alt="Join Link QR Code"
                  className="w-40 h-40 rounded-xl shadow-lg border"
                />
                <span className="text-xs text-gray-500 mt-2">Join Link QR</span>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Join Link QR байхгүй байна
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR + Attendance */}
      {running && selectedLectureName && qrData && qrImage && (
        <div className="flex flex-col xl:flex-row gap-8">
          {/* QR */}
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-white to-slate-50 p-8 rounded-2xl shadow-2xl border relative">
            {/* QR Image */}
            <div className="relative group">
              <img
                src={qrImage}
                alt="QR Code"
                className="w-100 h-100 rounded-xl shadow-lg cursor-pointer transition-transform duration-300 group-hover:scale-105"
                onClick={() => setOpen(true)}
              />

              {/* Countdown overlay */}
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-mono">
                {countdown}s
              </div>
            </div>

            {/* Fullscreen Modal */}
            {open && (
              <div
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                onClick={() => setOpen(false)}
              >
                <img
                  src={qrImage}
                  alt="QR Code"
                  className="w-[80%] max-w-3xl rounded-xl shadow-2xl"
                />
              </div>
            )}

            {/* QR link */}
            <div className="w-full mt-6">
              <div className="text-xs break-all bg-gray-50 border p-3 rounded-lg shadow-inner text-center">
                <a
                  href={qrData}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-medium hover:underline"
                >
                  {qrData}
                </a>
              </div>
            </div>

            {/* Lecture name + time */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mt-6 gap-3">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                {selectedLectureName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>{new Date().toLocaleTimeString()} -д эхэлсэн</span>
              </div>
            </div>
          </div>

          {/* Attendance List */}
          <div className="flex-1">
            {students.length > 0 ? (
              <Card className="h-full bg-white rounded-2xl shadow-xl border">
                <CardHeader className="flex items-center justify-between border-b px-8 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-700" />
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Бүртгэгдсэн сурагчид
                    </CardTitle>
                  </div>
                  <span className="text-sm text-gray-500">
                    {students.length} Нийт
                  </span>
                </CardHeader>

                <CardContent className="overflow-y-auto max-h-[28rem] py-2 px-8">
                  <ul className="space-y-2">
                    {students.map((student) => (
                      <li
                        key={student._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition"
                      >
                        {/* Student Info */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-slate-600">
                              {student.studentName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {student.studentName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {student.studentId}
                            </p>
                          </div>
                        </div>

                        {/* Time + Status */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">
                            {new Date(student.time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                            ирсэн
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                <p className="text-center text-gray-400">
                  Одоогоор бүртгэлтэй оюутан байхгүй байна
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
