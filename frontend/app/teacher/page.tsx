"use client";

import { useEffect, useRef, useState } from "react";
import { Users, QrCode, History, Menu, LogOut } from "lucide-react";

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
import { QRControlCenter } from "@/components/QrControlCenter";
import { AttendanceHistory } from "@/components/AttendanceHistory";
import { ClassroomsView } from "@/components/ClassroomsView";
import { RequireAuth } from "@/components/RequireAuth";
import { useRouter } from "next/navigation";
import { useAttendanceStorage } from "@/utils/storageUtils";

interface Student {
  _id: string;
  studentName: string;
  studentId: string;
  time: string;
}

export default function AttendanceDashboard() {
  const [activeView, setActiveView] = useState("attendance");
  const [teacherName, setTeacherName] = useState("");
  const [teacherImage, setTeacherImage] = useState("");

  // Persistent QR and attendance state
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [countdown, setCountdown] = useState(5);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [selectedLectureName, setSelectedLectureName] = useState("");

  // Timer refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRestoringRef = useRef(false);

  const router = useRouter();

  // Use the storage utilities
  const {
    saveState,
    restoreState,
    clearSession,
    hasActiveSession,
    getSessionDuration,
    updateActivity,
    saveSelectedClassroom,
    cleanupCorruptedEntries,
  } = useAttendanceStorage();

  useEffect(() => {
    cleanupCorruptedEntries();

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
      setQrImage(savedState.qrImage);

      console.log(
        `Restored attendance session (${getSessionDuration()} minutes old):`,
        savedState.attendanceId
      );
    }
  }, []);

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
        qrImage,
        sessionStartTime:
          running && !isRestoringRef.current ? Date.now() : undefined,
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
    qrImage,
  ]);

  const logOut = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);

    clearSession();
    localStorage.clear();
    router.push("/");
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

  const menuItems = [
    { id: "attendance", label: "Ирц бүртгэх", icon: QrCode },
    { id: "history", label: "Ирцийн түүх", icon: History },
    { id: "classrooms", label: "Ангийн жагсаалт", icon: Users },
  ];

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
                onClick={() => setActiveView(item.id)}
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
            className="w-full justify-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-md hover:scale-105 hover:shadow-lg"
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
            attendanceId={attendanceId}
            setAttendanceId={setAttendanceId}
            students={students}
            setStudents={setStudents}
            countdown={countdown}
            setCountdown={setCountdown}
            qrData={qrData}
            setQrData={setQrData}
            qrImage={qrImage}
            setQrImage={setQrImage}
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
            onStart={onStart}
            onStop={onStop}
            onClassroomChange={onClassroomChange}
            isRestoringSession={isRestoringRef.current}
          />
        );
      case "history":
        return <AttendanceHistory />;
      case "classrooms":
        return <ClassroomsView />;
      default:
        return null;
    }
  };

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
                      onClick={() => setActiveView(item.id)}
                      className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                        activeView === item.id
                          ? "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg"
                          : "hover:bg-slate-100 hover:text-slate-700 hover:shadow-md text-slate-600"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              <Button
                onClick={logOut}
                className="w-full justify-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-md hover:scale-105 hover:shadow-lg"
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
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </RequireAuth>
  );
}
