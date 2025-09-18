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
import { Label } from "@/components/ui/label";
import { Clock, Play, QrCode, Square } from "lucide-react";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

interface Classroom {
  _id: string;
  lectureName: string;
  joinLink?: string;
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

  // Timer ref now typed as number (browser timer ID)
  const timerRef = useRef<number | null>(null);

  // Fetch classrooms on mount
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

      // 🔥 Call backend to create attendance
      const res = await axios.post(
        "https://myrmidons-pinequest-backend.vercel.app/teacher/create-attendance",
        { classroomId: selectedClassroomId }
      );

      const newAttendance = res.data;
      const id = newAttendance._id;

      setAttendanceId(id); // 🔥 Store it

      generateQr(id); // ✅ Generate first QR with attendanceId

      setCountdown(5);
      setRunning(true);

      timerRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            generateQr(id); // 🔁 Regenerate with attendanceId
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Ирц үүсгэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const stop = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setRunning(false);
    setQrData(null);
    setQrImage(null);

    if (attendanceId) {
      try {
        await axios.put(
          "https://myrmidons-pinequest-backend.vercel.app/teacher/end-classroom",
          { attendanceId }
        );
        console.log("Attendance session ended.");
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || "Ирц дуусгах үед алдаа гарлаа");
      }
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRunning(false);
    setCountdown(5);
    setQrData(null);
    setQrImage(null);
    setAttendanceId(null);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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
          <div className="flex flex-row gap-10">
            {/* Left side: Select + buttons */}
            <div className="flex flex-col gap-4 w-[255px]">
              <div className="space-y-2 ">
                <Label htmlFor="classroomSelect">Ангийг сонгох</Label>
                <select
                  id="classroomSelect"
                  className="w-full px-4 py-2 border rounded"
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
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={start}
                  disabled={!selectedLectureName || loading}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white"
                >
                  <Play className="w-4 h-4" />
                  {loading ? "Хүлээнэ үү..." : "QR үүсгэх"}
                </Button>
                <Button
                  disabled={!running}
                  onClick={stop}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  QR зогсоох
                </Button>
              </div>
            </div>

            {/* Right side: Join Link QR */}
            <div className="flex items-center mt-4 lg:mt-0">
              <div className="flex items-center mt-4 lg:mt-0">
                {joinLinkQr ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={joinLinkQr}
                      alt="Join Link QR Code"
                      className="w-40 h-40 sm:w-48 sm:h-48 rounded-lg shadow-md"
                    />
                    <span className="text-xs text-gray-500 mt-1">
                      Join Link
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Join Link QR байхгүй байна
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Display Card */}
      {running && selectedLectureName && qrData && qrImage && (
        <Card className="border-slate-200 bg-slate-50/50">
          <CardContent className="p-8">
            <div className="flex flex-col xl:flex-row items-center gap-8">
              <div className="flex-1 space-y-4">
                <div className="text-center xl:text-left">
                  <div className="flex flex-col items-center mb-6">
                    <img
                      src={qrImage}
                      alt="QR Code"
                      className="w-64 h-64 rounded-lg shadow-lg mb-4"
                    />
                    <div className="text-xs text-gray-600 break-all max-w-xs bg-white p-2 rounded shadow">
                      <a
                        href={qrData}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {qrData}
                      </a>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground">
                    {selectedLectureName}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{new Date().toLocaleTimeString()}-д эхэлсэн</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
