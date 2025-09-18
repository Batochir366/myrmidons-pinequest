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
  const [open, setOpen] = useState(false); // 👈 QR томруулах state

  const timerRef = useRef<number | null>(null);

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

    addMockStudent();
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

      const id = uuidv4();
      setAttendanceId(id);

      generateQr(id);

      setCountdown(5);
      setRunning(true);

      timerRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            generateQr(id);
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
    setStudents([]);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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
  <Label htmlFor="classroomSelect" className="font-semibold text-gray-700">
      <Users />
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
    {/* Custom arrow */}
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
                <span className="text-xs text-gray-500 mt-2">
                  Join Link QR
                </span>
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
      onClick={() => setOpen(true)} // 👈 дээр нь дарвал нээх
    />
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
              {/* Зураг + Нэр + Код */}
              <div className="flex items-center gap-3">
                <img
                  src={s.avatar}
                  alt={s.name}
                  className="w-10 h-10 rounded-full border shadow-sm"
                />
                <div>
                  <p className="font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.studentCode}</p>
                </div>
              </div>

              {/* Цаг + Статус */}
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
