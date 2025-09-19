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
  id: string;
  name: string;
  studentCode: string;
  avatar?: string;
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

  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // === Picture-in-Picture ===
  const openPiP = async () => {
    if (!canvasRef.current || !videoRef.current || !attendanceId) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const video = videoRef.current;

    const drawQrToCanvas = (dataUrl: string) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        canvas.width = 256;
        canvas.height = 256;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    };

    // Анхны QR үүсгэж canvas-д зурна
    const initialQr = await generateQr(attendanceId);
    drawQrToCanvas(initialQr);

    const stream = canvas.captureStream();
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    await video.play();
    await video.requestPictureInPicture();

    const interval = setInterval(async () => {
      if (!attendanceId) return;
      const newQr = await generateQr(attendanceId);
      drawQrToCanvas(newQr);
    }, 5000);

    video.onleavepictureinpicture = () => clearInterval(interval);
  };

  // Fetch classrooms
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const teacherId = localStorage.getItem("teacherId");
        if (!teacherId) return;

        const res = await axios.get(
          `https://myrmidons-pinequest-backend.vercel.app/teacher/${teacherId}/classes`
        );

        setClassrooms(res.data.classrooms || []);
      } catch (error) {
        console.error("Error fetching classrooms:", error);
        alert("Ангийн мэдээлэл авахад алдаа гарлаа");
      }
    };

    fetchClassrooms();
  }, []);

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

  // QR үүсгэх асинхрон функц
  const generateQr = (attendanceId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const token = uuidv4();
      const expiresAt = Date.now() + 5000;
      const url = `https://myrmidons-pinequest-frontend.vercel.app/student?token=${token}&expiresAt=${expiresAt}&attendanceId=${attendanceId}`;

      setQrData(url);

      QRCode.toDataURL(url, { width: 256 }, (err, dataUrl) => {
        if (err) {
          console.error("Error generating QR code:", err);
          reject(err);
        } else {
          setQrImage(dataUrl);
          resolve(dataUrl);
        }
      });

      addMockStudent();
    });
  };

  const addMockStudent = () => {
    const fakeStudents: Student[] = [
      {
        id: uuidv4(),
        name: "Батболд",
        studentCode: "ST001",
        avatar: "https://i.pravatar.cc/100?img=1",
        time: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: "Сараа",
        studentCode: "ST002",
        avatar: "https://i.pravatar.cc/100?img=2",
        time: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: "Төгөлдөр",
        studentCode: "ST003",
        avatar: "https://i.pravatar.cc/100?img=3",
        time: new Date().toISOString(),
      },
    ];

    const randomStudent =
      fakeStudents[Math.floor(Math.random() * fakeStudents.length)];
    setStudents((prev) => [randomStudent, ...prev]);
  };

  const onClassroomChange = (selectedId: string) => {
    if (running) stopTimer();
    setSelectedClassroomId(selectedId);

    const classroom = classrooms.find((c) => c._id === selectedId);
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
    if (running) return;
    if (!selectedClassroomId) return alert("Ангийг сонгоно уу");

    try {
      setLoading(true);
      const id = uuidv4();
      setAttendanceId(id);

      await generateQr(id); // эхний QR

      setCountdown(5);
      setRunning(true);

      timerRef.current = window.setInterval(async () => {
        setCountdown((prev) => {
          if (prev === 1) {
            generateQr(id); // QR-г шинэчлэх
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRunning(false);
    setQrData(null);
    setQrImage(null);
    setStudents([]);
    setAttendanceId(null);
  };

  const stopTimer = () => {
    stop();
    setCountdown(5);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8 p-6">
      <video ref={videoRef} style={{ display: "none" }} muted playsInline />
      <canvas ref={canvasRef} style={{ display: "none" }} />

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
                <Users />
                Ангийг сонгох
              </Label>
              <div className="relative">
                <select
                  id="classroomSelect"
                  className="w-full appearance-none px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white text-gray-800"
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
                disabled={!selectedLectureName || loading}
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
            <div className="relative group">
              <img
                src={qrImage}
                alt="QR Code"
                className="w-100 h-100 rounded-xl shadow-lg cursor-pointer transition-transform duration-300 group-hover:scale-105"
                onClick={() => setOpen(true)}
              />
            </div>

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

            <div className="flex flex-col sm:flex-row gap-3 items-center mt-6">
              <Button
                onClick={openPiP}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                PiP QR нээх
              </Button>

              <Button
                onClick={() =>
                  qrData && window.open(qrData, "_blank", "noopener,noreferrer")
                }
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                QR линк нээх
              </Button>
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
                      Registered Students
                    </CardTitle>
                  </div>
                  <span className="text-sm text-gray-500">
                    {students.length} Total
                  </span>
                </CardHeader>

                <CardContent className="overflow-y-auto max-h-[28rem] py-2 px-8">
                  <ul className="space-y-2">
                    {students.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={s.avatar}
                            alt={s.name}
                            className="w-10 h-10 rounded-full border shadow-sm"
                          />
                          <div>
                            <p className="font-medium text-gray-800">
                              {s.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {s.studentCode}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">
                            {new Date(s.time).toLocaleTimeString([], {
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
              <p className="text-center text-gray-400 mt-6">
                Одоогоор бүртгэлтэй оюутан байхгүй байна
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
