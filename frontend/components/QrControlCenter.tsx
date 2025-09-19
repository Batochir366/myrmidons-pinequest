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
  const [joinLinkQr, setJoinLinkQr] = useState<string | null>(
    "data:image/png;base64,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"
  );
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
          `https://myrmidons-pinequest-backend.vercel.app/teacher/classrooms/${teacherId}`
        );

        setClassrooms(res.data.classrooms || []);
      } catch (error) {
        console.error("Error fetching classrooms:", error);
        // alert("Ангийн мэдээлэл авахад алдаа гарлаа");
      }
    };

    if (teacherId) {
      fetchClassrooms();
    }
  }, []);

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

    const url = `https://myrmidons-pinequest-frontend-delta.vercel.app/student?token=${token}&expiresAt=${expiresAt}&attendanceId=${attendanceId}`;

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

      // // Start polling for real attendance data every 2 seconds
      // pollRef.current = window.setInterval(() => {
      //   pollAttendanceData(_id);
      // }, 2000);
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
