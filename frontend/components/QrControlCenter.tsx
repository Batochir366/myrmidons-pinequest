"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clock,
  Play,
  QrCode,
  Square,
  Users,
  UserCheck,
  RefreshCw,
  ZoomIn,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import AttendanceList from "./AttendanceList";

export function QRControlCenter() {
  const [lectureName, setLectureName] = useState("");
  const [lectureDate, setLectureDate] = useState("");
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [attendedStudents, setAttendedStudents] = useState<
    Array<{
      id: string;
      name: string;
      time: string;
      studentCode: string;
      avatar?: string;
    }>
  >([]);
  const [qrFullscreen, setQrFullscreen] = useState(false);

  const timerRef = useRef<NodeJS.Timer | null>(null);

  // Жишээ сурагчдын өгөгдөл
  const sampleStudents = [
    "Батбаяр",
    "Оюунболд",
    "Цэцэгмаа",
    "Болдбаяр",
    "Сарантуяа",
    "Энхбат",
    "Алтанцэцэг",
    "Мөнхбат",
    "Одгэрэл",
    "Бямбасүрэн",
    "Нарантуяа",
    "Төмөрбат",
    "Цагаанцэцэг",
    "Баярмагнай",
    "Мөнхтуяа",
  ];

  const addRandomStudent = () => {
    const availableNames = sampleStudents.filter(
      (name) => !attendedStudents.some((student) => student.name === name)
    );
    if (availableNames.length === 0) return;

    const randomName =
      availableNames[Math.floor(Math.random() * availableNames.length)];
    const studentCode = `ST${String(Math.floor(Math.random() * 9999)).padStart(
      4,
      "0"
    )}`;
    const now = new Date();
    const timeString = now.toLocaleTimeString("mn-MN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const newStudent = {
      id: `student_${Date.now()}`,
      name: randomName,
      time: timeString,
      studentCode,
      avatar: `https://i.pravatar.cc/40?u=${randomName}`,
    };
    setAttendedStudents((prev) => [newStudent, ...prev]);
  };

  const generateQr = (classroomId: string) => {
    const token = uuidv4();
    const expiresAt = Date.now() + 5000;
    const url = `https://myrmidons-pinequest-frontend.vercel.app/student?token=${token}&expiresAt=${expiresAt}&classroomId=${classroomId}`;
    setQrData(url);

    QRCode.toDataURL(url, { width: 256 }, (err, dataUrl) => {
      if (err) console.error(err);
      else setQrImage(dataUrl);
    });

    // Симуляцийн хувьд санамсаргүй сурагч нэмэх
    if (Math.random() > 0.3)
      setTimeout(() => addRandomStudent(), Math.random() * 4000 + 1000);
  };

  const start = async () => {
    if (running || !lectureName || !lectureDate) return;
    try {
      setLoading(true);
      setAttendedStudents([]);
      const teacherId = "68ca19c53ecd6845b3ff9508";
      const { data: classroom } = await axios.post(
        "https://myrmidons-pinequest-backend.vercel.app/teacher/create",
        { teacherId, lectureName, lectureDate }
      );
      setClassroomId(classroom._id);
      generateQr(classroom._id);
      setCountdown(5);
      setRunning(true);

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            generateQr(classroom._id);
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Classroom үүсгэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const stop = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current as any);
      timerRef.current = null;
    }
    setRunning(false);
    setQrData(null);
    setQrImage(null);
    setQrFullscreen(false);

    if (classroomId) {
      try {
        await axios.post(
          "https://myrmidons-pinequest-backend.vercel.app/teacher/end-classroom",
          { classroomId }
        );
      } catch (err: any) {
        console.error(err);
        alert(
          err.response?.data?.message || "Classroom дуусгах үед алдаа гарлаа"
        );
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current as any);
    };
  }, []);

  const progressPercentage = ((5 - countdown) / 5) * 100;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6">
      {/* QR Control Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR ирц удирдлага
          </CardTitle>
          <CardDescription>
            Сурагчдын ирцийг хянах QR код үүсгэх
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lectureName">Хичээлийн нэр</Label>
              <Input
                id="lectureName"
                placeholder="жишээ нь: Компьютерийн ухаан 101"
                value={lectureName}
                onChange={(e) => setLectureName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lectureDate">Хичээлийн огноо</Label>
              <Input
                id="lectureDate"
                type="date"
                value={lectureDate}
                onChange={(e) => setLectureDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={start}
              disabled={!lectureName || !lectureDate || loading}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white"
            >
              <Play className="w-4 h-4" /> {loading ? "Болно..." : "QR үүсгэх"}
            </Button>
            <Button
              onClick={stop}
              disabled={!running}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" /> QR зогсоох
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Display Card */}
      {running && lectureName && lectureDate && qrData && qrImage && (
        <Card className="border-slate-200 bg-slate-50/50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[500px]">
              {/* Left - QR Code */}
              <div className="flex flex-col relative items-center justify-center">
                <Card className="flex-1 w-full">
                  <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                    <button
                      onClick={() => setQrFullscreen(true)}
                      className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition"
                    >
                      <ZoomIn />
                    </button>

                    <div className="relative">
                      <img
                        src={qrImage}
                        alt="QR Code"
                        className="w-100 h-100 rounded-lg shadow-lg mx-auto"
                      />
                      {/* Countdown */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                        <div className="bg-white px-3 py-1 rounded-full shadow-lg border flex items-center gap-2">
                          <RefreshCw
                            className={`w-3 h-3 text-blue-600 ${
                              running ? "animate-spin" : ""
                            }`}
                          />
                          <span className="text-xs font-medium">
                            {countdown}с дараа шинэчлэгдэнэ
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <a
                        href={qrData}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                      >
                        Сурагчдын холбоос
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right - Attendance */}
              <div className="flex flex-col">
                <AttendanceList
                  students={attendedStudents}
                  running={running}
                  onAddRandomStudent={addRandomStudent}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fullscreen Overlay */}
      {qrFullscreen && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
          <div className="relative">
            <img
              src={qrImage!}
              alt="QR Fullscreen"
              className="w-[100vw] h-[100vw] max-w-[850px] max-h-[850px] rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setQrFullscreen(false)}
              className="absolute top-2 right-2 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition text-xl"
            >
              <X />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
