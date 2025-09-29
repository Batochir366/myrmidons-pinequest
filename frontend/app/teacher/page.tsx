"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Users, QrCode, History, Menu, LogOut } from "lucide-react";
import jwtEncode from "jwt-encode";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AttendanceHistory } from "@/components/AttendanceHistory";
import { ClassroomsView } from "@/components/ClassroomsView";
import { RequireAuth } from "@/components/RequireAuth";
import { useRouter } from "next/navigation";
import { useAttendanceStorage } from "@/utils/storageUtils";
import { axiosInstance, axiosInstanceFront } from "@/lib/utils";
import { toast } from "sonner";
import { getLocation } from "@/utils/getLocation";
import { PiPProvider } from "@/utils/PiPProvider";
import { QRControlCenter } from "@/components/QrControlCenter";
import type QRCodeStyling from "qr-code-styling";

interface Student {
  _id: string;
  studentName: string;
  studentId: string;
  time: string;
  faceImage?: string | null;
}

export default function AttendanceDashboard() {
  const [activeView, setActiveView] = useState("attendance");
  const [teacherName, setTeacherName] = useState("");
  const [teacherImage, setTeacherImage] = useState("");
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [countdown, setCountdown] = useState(5);
  const [qrData, setQrData] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [selectedLectureName, setSelectedLectureName] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pipProviderRef = useRef<any>(null);
  const qrSvgRef = useRef<string>("");
  const isPiPActiveRef = useRef(false);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [qrSvg, setQrSvg] = useState<string>("");
  const [pipActive, setPipActive] = useState(false);
  const qrCode = useRef<QRCodeStyling | null>(null);
const faceImageCacheRef = useRef<Map<string, string | null>>(new Map());

  useEffect(() => {
    // Update qrSvg state when qrSvgRef changes
    setQrSvg(qrSvgRef.current);
  }, [qrSvgRef.current]);
  const isRestoringRef = useRef(false);
  const [qrSec, setQrSec] = useState(() => {
    if (typeof window !== "undefined") {
      const storedTime = localStorage.getItem("qr_generation_seconds");
      return storedTime ? Number(storedTime) : 5;
    }
    return 5;
  });
  const handleSave = (newSec: number) => {
    const sec = !isNaN(newSec) && newSec >= 3 ? newSec : 3;
    setQrSec(sec);
    localStorage.setItem("qr_generation_seconds", sec.toString());
  };

  const router = useRouter();
  const {
    saveState,
    restoreState,
    clearSession,
    getSessionDuration,
    updateActivity,
    saveSelectedClassroom,
    getSelectedClassroom,
    cleanupCorruptedEntries,
  } = useAttendanceStorage();

  useEffect(() => {
    cleanupCorruptedEntries();

    // Load teacher info
    const storedName = localStorage.getItem("teacherName");
    const storedImage = localStorage.getItem("teacherImage");
    if (storedName) {
      setTeacherName(storedName);
      setTeacherImage(storedImage || "");
    }
    const savedState = restoreState();
    if (savedState && savedState.isRunning) {
      isRestoringRef.current = true;
      setAttendanceId(savedState.attendanceId);
      setSelectedClassroomId(savedState.selectedClassroomId);
      setSelectedLectureName(savedState.selectedLectureName);
      setRunning(savedState.isRunning);
      setStudents(savedState.students);
      setCountdown(savedState.countdown);
      setQrData(savedState.qrData);
      setQrSec(savedState.qrSec);
      setQrSvg(savedState.qrSvg || "");

      if (savedState.pipActive && pipProviderRef.current) {
        pipProviderRef.current.openPiP();
      }
    } else {
      // Load last selected classroom for convenience
      const lastClassroom = getSelectedClassroom();
      if (lastClassroom) {
        setSelectedClassroomId(lastClassroom.classroomId);
        setSelectedLectureName(lastClassroom.lectureName);
      }
    }
  }, []);


  const fetchFaceImage = async (studentId: string): Promise<string | null> => {
  try {
    const imageRes = await axiosInstance.get(`/image/get/${studentId}`);
    return imageRes.data.image || null;
  } catch (err) {
    console.warn(`No face image found for student ${studentId}`);
    return null;
  }
};
  // In your saveState calls, make sure you're saving PiP state
  useEffect(() => {
    if (running || attendanceId) {
      saveState({
        attendanceId,
        selectedClassroomId,
        selectedLectureName,
        isRunning: running,
        students,
        countdown,
        qrData,
        qrSec,
        sessionStartTime:
          running && !isRestoringRef.current ? Date.now() : undefined,
        qrSvg,
        pipActive: pipProviderRef.current?.isActive ?? false,
      });
    }
  }, [
    attendanceId,
    selectedClassroomId,
    selectedLectureName,
    running,
    students,
    countdown,
    qrData,
    qrSec,
    pipActive,
    qrSvg,
  ]);

  const generateQr = useCallback(
    (attendanceId: string) => {
      const expiresAt = Math.floor((Date.now() + qrSec * 1000) / 1000);

      const payload = {
        attendanceId,
        classroomId: selectedClassroomId,
        exp: expiresAt,
      };
      const secret = "FACE";
      const token = jwtEncode(payload, secret);
      const url = `${axiosInstanceFront}student?token=${token}`;

      setQrData(url);
    },
    [qrSec, selectedClassroomId]
  );
  const startQRTimer = useCallback(
    (attendanceId: string) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      generateQr(attendanceId);
      setCountdown(qrSec);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            generateQr(attendanceId);
            return qrSec;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [qrSec, generateQr]
  );

const pollAttendanceData = useCallback(async (attendanceId: string) => {
  try {
    const res = await axiosInstance.get(`attendance/live/${attendanceId}`);
    const attendingStudents = res.data.attendance?.attendingStudents || [];

    const currentCache = faceImageCacheRef.current;

    const newStudentIds = attendingStudents
      .map((s: any) => s.studentId)
      .filter((id: string) => !currentCache.has(id));

    if (newStudentIds.length > 0) {
      const newImages = await Promise.all(
        newStudentIds.map(async (studentId: string) => {
          const image = await fetchFaceImage(studentId);
          return { studentId, image };
        })
      );

      newImages.forEach(({ studentId, image }) => {
        currentCache.set(studentId, image);
      });
    }

    const studentsWithImages = attendingStudents.map((s: any) => ({
      _id: s._id,
      studentName: s.studentName,
      studentId: s.studentId,
      time: s.time || new Date().toISOString(),
      faceImage: currentCache.get(s.studentId) ?? null,
    }));

    setStudents(studentsWithImages);
  } catch (err) {
    console.error("Error polling attendance data:", err);
  }
}, []); 
  // Resume timers if session is being restored
  useEffect(() => {
    if (
      isRestoringRef.current &&
      running &&
      attendanceId &&
      !timerRef.current &&
      !pollRef.current
    ) {
      startQRTimer(attendanceId);
      pollRef.current = setInterval(
        () => pollAttendanceData(attendanceId),
        2000
      );
      isRestoringRef.current = false; // Reset the flag
    }
  }, [running, attendanceId, startQRTimer, pollAttendanceData]);

  // Update QR timer when qrSec changes (even if on different view)
  useEffect(() => {
    if (running && attendanceId) {
      startQRTimer(attendanceId);
    }
  }, [qrSec, running, attendanceId, startQRTimer]);

  // CRITICAL: Keep timers running regardless of active view
  const handleViewChange = (newView: string) => {
    setActiveView(newView);
  };
  const logOut = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);

    if (pipProviderRef.current?.isActive) {
      pipProviderRef.current?.closePiP();
    }

    clearSession();
    localStorage.clear();
    router.push("/");
  };

const stopTimer = () => {
  if (timerRef.current) clearInterval(timerRef.current);
  if (pollRef.current) clearInterval(pollRef.current);
  if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);

  if (pipProviderRef.current?.isActive) {
    pipProviderRef.current?.closePiP();
  }

  timerRef.current = null;
  pollRef.current = null;
  updateIntervalRef.current = null;

  setRunning(false);
  setPipActive(false);
  setCountdown(qrSec);
  setQrData(null);
  setAttendanceId(null);
  setStudents([]);
  setQrSvg("");
  faceImageCacheRef.current = new Map();; 

  clearSession();
};

  const onStart = () => {
    setRunning(true);
    updateActivity();
  };

  const onStop = () => {
    stopTimer();
    updateActivity();
  };

  const onClassroomChange = (id: string, lectureName: string) => {
    setSelectedClassroomId(id);
    setSelectedLectureName(lectureName);
    saveSelectedClassroom(id, lectureName);
    updateActivity();
  };

const start = async () => {
  if (running || !selectedClassroomId || !selectedLectureName) {
    toast.error("Ангийг сонгоно уу!");
    return;
  }

  setLoading(true);

  try {
    const res = await axiosInstance.get(
      `teacher/classroom-students/${selectedClassroomId}`
    );

    const { students = [], empty, message } = res.data;

    if (empty || students.length === 0) {
      toast.error(
        message ||
          "Энэ ангид оюутан байхгүй тул ирц эхлүүлэх боломжгүй байна!"
      );
      setLoading(false);
      return;
    }    
    const { latitude, longitude } = await getLocation();

    const attendanceRes = await axiosInstance.post(
      "teacher/create-attendance",
      {
        classroomId: selectedClassroomId,
        latitude,
        longitude,
      }
    );

    const { _id } = attendanceRes.data;

    if (!_id) throw new Error("Attendance ID алга");

    setAttendanceId(_id);
    setRunning(true);
    onStart();

    // Start with empty students list - polling will populate it
    setStudents([]);

    startQRTimer(_id);
    pollRef.current = setInterval(() => pollAttendanceData(_id), 2000);

    toast.success(`Ирц эхлэлээ! QR ${qrSec} секунд тутамд шинэчлэгдэнэ.`);
  } catch (err) {
    console.error("Error starting attendance:", err);
    toast.error("Ирц эхлүүлэхэд алдаа гарлаа");
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

  const menuItems = [
    { id: "attendance", label: "Ирц бүртгэх", icon: QrCode },
    { id: "history", label: "Ирцийн түүх", icon: History },
    { id: "classrooms", label: "Ангийн жагсаалт", icon: Users },
  ];

  const pipState = pipActive
    ? {
        isActive: true,
        qrData: qrData || "",
        timestamp: Date.now(),
        attendanceId: attendanceId || "",
        qrSec,
      }
    : null;
  const MobileSidebar = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-64 p-0 bg-white dark:bg-gray-900 border-r border-border"
      >
        <SheetTitle className="sr-only">Mobile Sidebar Navigation</SheetTitle>

        <div className="h-[89px] p-6 bg-gray-50 dark:bg-gray-800 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-lg">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">A+</h2>
              <p className="text-xs text-muted-foreground font-medium">
                Ирц хянах систем
              </p>
            </div>
          </div>
        </div>
        <div className="px-4 py-6 bg-white dark:bg-gray-900 flex flex-col justify-between h-full pb-15">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                variant={activeView === item.id ? "default" : "ghost"}
                className={`w-full justify-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  activeView === item.id
                    ? "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg"
                    : "hover:bg-slate-100 hover:text-slate-700 hover:shadow-md text-slate-600"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Button>
            ))}
          </div>
          <Button
            onClick={logOut}
            className="w-full justify-center gap-3 px-4 py-3 rounded-xl bg-slate-700 text-white shadow-md hover:scale-105 hover:shadow-lg"
          >
            Системээс гарах
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );

  const renderContent = () => {
    switch (activeView) {
      case "attendance":
        return (
          <QRControlCenter
            pipProviderRef={pipProviderRef}
            attendanceId={attendanceId}
            setAttendanceId={setAttendanceId}
            students={students}
            setStudents={setStudents}
            countdown={countdown}
            setCountdown={setCountdown}
            qrData={qrData}
            setQrData={setQrData}
            running={running}
            setRunning={setRunning}
            loading={loading}
            setLoading={setLoading}
            selectedClassroomId={selectedClassroomId}
            setSelectedClassroomId={setSelectedClassroomId}
            selectedLectureName={selectedLectureName}
            setSelectedLectureName={setSelectedLectureName}
            timerRef={timerRef}
            pollRef={pollRef}
            qrSec={qrSec}
            setQrSec={setQrSec}
            onStart={onStart}
            onStop={onStop}
            onClassroomChange={onClassroomChange}
            isRestoringSession={isRestoringRef.current}
            handleSave={handleSave}
            start={start}
            stop={stop}
            startQRTimer={startQRTimer}
            pollAttendanceData={pollAttendanceData}
            pipActive={pipActive}
            qrSvg={qrSvg}
            setQrSvg={setQrSvg}
          />
        );
      case "history":
        return (
          <div>
            <AttendanceHistory />
            {/* Show running QR status even in other views */}
            {running && (
              <div className="hidden bottom-4 right-4 bg-green-100 border border-green-300 rounded-lg p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-800">
                    QR ирц ажиллаж байна ({countdown}s)
                  </span>
                  {/* Optional: Close PiP button if PiP is active */}
                  {pipProviderRef.current?.isActive && (
                    <button
                      onClick={() => pipProviderRef.current?.closePiP()}
                      className="ml-2 text-red-700 underline text-sm"
                    >
                      PiP хаах
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case "classrooms":
        return (
          <div>
            <ClassroomsView />
            {/* Show running QR status even in other views */}
            {running && (
              <div className="hidden bottom-4 right-4 bg-green-100 border border-green-300 rounded-lg p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-800">
                    QR ирц ажиллаж байна ({countdown}s)
                  </span>
                  {/* Optional: Close PiP button if PiP is active */}
                  {pipProviderRef.current?.isActive && (
                    <button
                      onClick={() => pipProviderRef.current?.closePiP()}
                      className="ml-2 text-red-700 underline text-sm"
                    >
                      PiP хаах
                    </button>
                  )}
                  {/* Button to go back to attendance view */}
                  <button
                    onClick={() => setActiveView("attendance")}
                    className="ml-2 text-green-700 underline text-sm"
                  >
                    Харах
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };
  const onPiPStart = () => {
    setPipActive(true);
    isPiPActiveRef.current = true;
  };

  const onPiPStop = () => {
    setPipActive(false);
    isPiPActiveRef.current = false;
  };

  // Generate SVG from qrData in background
  useEffect(() => {
    if (!qrData) return;

    import("qr-code-styling").then(({ default: QRCodeStyling }) => {
      const qr = new QRCodeStyling({
        width: 400,
        height: 400,
        type: "svg",
        data: qrData,
        dotsOptions: { color: "#1a2b48", type: "rounded" },
        cornersSquareOptions: { color: "#1a2b48", type: "square" },
        cornersDotOptions: { color: "#fbbc05" },
        backgroundOptions: { color: "transparent" },
        qrOptions: { typeNumber: 0, mode: "Byte" },
      });

      qr.getRawData("svg")
        .then((value: any) => {
          if (!value) return;

          if (value instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
              setQrSvg(reader.result as string);
            };
            reader.readAsText(value);
          } else if (value instanceof ArrayBuffer) {
            const svgString = new TextDecoder().decode(value);
            setQrSvg(svgString);
          } else if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) {
            const arrayBuffer = value.buffer.slice(
              value.byteOffset,
              value.byteOffset + value.byteLength
            );
            const svgString = new TextDecoder().decode(arrayBuffer);
            setQrSvg(svgString);
          }
        })
        .catch(console.error);
    });
  }, [qrData]);

  return (
    <RequireAuth>
      <SidebarProvider>
        <div className="flex min-h-screen bg-background w-full">
          <Sidebar className="hidden md:flex border-r border-border bg-white dark:bg-gray-900">
            <SidebarHeader className="h-[81px] p-6 border-b border-border bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-lg">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground">A+</h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    Ирц хянах систем
                  </p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="px-4 pt-6 pb-20 bg-white dark:bg-gray-900 flex flex-col justify-between">
              <SidebarMenu className="space-y-2">
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <button
                      onClick={() => handleViewChange(item.id)}
                      className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium relative ${
                        activeView === item.id
                          ? "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg"
                          : "hover:bg-slate-100 hover:text-slate-700 hover:shadow-md text-slate-600"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                      {/* Show indicator if QR is running and not on attendance view */}
                      {running &&
                        item.id !== "attendance" &&
                        activeView === item.id && (
                          <div className="absolute right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        )}
                    </button>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              <Button
                onClick={logOut}
                className="w-full justify-center gap-3 px-4 py-3 rounded-xl bg-slate-700 text-white shadow-md hover:scale-105 hover:shadow-lg"
              >
                Системээс гарах
                <LogOut className="w-5 h-5" />
              </Button>
            </SidebarContent>
          </Sidebar>

          <div className="flex-1 flex flex-col min-w-0 w-full">
            {/* Header */}
            <header className="border-b border-border bg-card px-4 sm:px-6 py-4 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <MobileSidebar />
                  <SidebarTrigger className="hidden md:flex" />
                  <div>
                    <h1 className="text-xl font-semibold text-card-foreground">
                      Сайн байна уу, Багш {teacherName}
                    </h1>
                    <p className="text-sm text-muted-foreground hidden sm:block">
                      Ирцийн хяналтын самбарт тавтай морилно уу
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Show QR status indicator when running */}
                  {running && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="hidden md:inline">Ирц авж байна...</p>
                    </div>
                  )}
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={teacherImage} />
                    <AvatarFallback>PS</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 overflow-auto w-full">
              <div className="w-full max-w-[1600px] mx-auto">
                {renderContent()}
                <PiPProvider
                  ref={pipProviderRef}
                  qrSvg={qrSvg} // Changed from qrData
                  qrSec={qrSec}
                  onPiPStart={onPiPStart}
                  onPiPStop={onPiPStop}
                />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </RequireAuth>
  );
}
