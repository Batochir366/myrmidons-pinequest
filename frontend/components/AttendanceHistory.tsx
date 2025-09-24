"use client";

import { useEffect, useState } from "react";
import { CalendarIcon, Eye, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ViewReport } from "./VIewReport";
import { axiosInstance } from "@/lib/utils";
import { AttendanceChart } from "./AttendanceChart";
import { useRef, useLayoutEffect } from "react";
import { toast } from "sonner";

interface AttendanceRecord {
  id: number;
  lectureName: string;
  lectureDate: string;
  date: string;
  startTime: string;
  endTime: string;
  qrStartTime: string;
  qrEndTime: string;
  totalStudents: number;
  presentStudents: number;
  attendanceRate: number;
  students: {
    id: number;
    name: string;
    code: string;
    photo: string;
    timestamp?: string;
  }[];
}

export function AttendanceHistory() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [reloadFlag, setReloadFlag] = useState(0);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedLecture, setSelectedLecture] =
    useState<AttendanceRecord | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(false);

  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // calendar height measure
  const calendarRef = useRef<HTMLDivElement>(null);
  const [calendarHeight, setCalendarHeight] = useState<number | undefined>(
    undefined
  );
  const [saveStatus, setSaveStatus] = useState("");
  useLayoutEffect(() => {
    const measureHeight = () => {
      if (calendarRef.current) {
        setCalendarHeight(calendarRef.current.offsetHeight);
      }
    };
    measureHeight();
    window.addEventListener("resize", measureHeight);
    return () => window.removeEventListener("resize", measureHeight);
  }, []);

  const rightSectionRef = useRef<HTMLDivElement>(null);
  const [rightSectionWidth, setRightSectionWidth] = useState<number>(0);

  useEffect(() => {
    if (!rightSectionRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setRightSectionWidth(entry.contentRect.width);
      }
    });
    observer.observe(rightSectionRef.current);
    return () => observer.disconnect();
  }, []);

  const getAttendanceForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;
    return attendanceData.filter((record) => record.date === dateString);
  };

  const selectedDateAttendance = selectedDate
    ? getAttendanceForDate(selectedDate)
    : [];

  const getLectureDays = () => {
    return attendanceData.map((record) => new Date(record.date));
  };

  const transformApiData = (classrooms: any[]): AttendanceRecord[] => {
    return classrooms.flatMap((classroom) => {
      return classroom.attendanceHistory.map((history: any) => {
        const dateObj = new Date(history.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");

        const students = classroom.ClassroomStudents.map((student: any) => {
          const attended = history.attendingStudents.find(
            (att: any) => att.student.studentId === student.studentId
          );
          return {
            id: student._id,
            name: student.name,
            code: student.studentId,
            timestamp: attended
              ? new Date(attended.attendedAt).toLocaleTimeString()
              : null,
          };
        });

        return {
          id: history._id,
          lectureName: classroom.lectureName,
          lectureDate: classroom.lectureDate,
          date: `${year}-${month}-${day}`,
          qrStartTime: new Date(history.date).toLocaleTimeString(),
          qrEndTime: history.endedAt
            ? new Date(history.endedAt).toLocaleTimeString()
            : "--",
          totalStudents: classroom.ClassroomStudents.length,
          presentStudents:
            history.totalAttending ?? history.attendingStudents.length,
          attendanceRate: classroom.ClassroomStudents.length
            ? Math.round(
                ((history.totalAttending ?? history.attendingStudents.length) /
                  classroom.ClassroomStudents.length) *
                  100
              )
            : 0,
          students,
        };
      });
    });
  };

  useEffect(() => {
    const teacherId = localStorage.getItem("teacherId");
    if (!teacherId) return;

    axiosInstance
      .get(`teacher/classrooms/${teacherId}`)
      .then((res) => {
        const transformed = transformApiData(res.data.classrooms);
        setAttendanceData(transformed);
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, [reloadFlag]); // 👈 reloadFlag солигдох болгонд fetch хийнэ

  const handleSave = async (attendanceId: string, studentId: string) => {
    if (!studentId.trim()) {
      toast.error("Оюутны код оруулна уу");
      return;
    }

    setLoading(true);

    try {
      await axiosInstance.put("/student/add", {
        attendanceId,
        studentId: studentId.trim(),
      });

      toast.success("Оюутны ирц амжилттай бүртгэгдлээ");

      setReloadFlag((prev) => prev + 1);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Бүртгүүлэх эрхгүй байна");
      } else if (err.response?.status === 404) {
        toast.error("Оюутан олдсонгүй");
      } else if (err.response?.status === 400) {
        toast.error("Аль хэдийн ирц бүртгэгдсэн байна.");
      } else {
        toast.error(err.message || "Тодорхойгүй алдаа гарлаа");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDateAttendance.length > 0) {
      setSelectedLecture(selectedDateAttendance[0]);
      setShowReport(false);
    } else {
      setSelectedLecture(null);
      setShowReport(false);
    }
  }, [selectedDate, reloadFlag]);

  return (
    <TooltipProvider>
      <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 overflow-y-auto min-h-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Calendar Section */}
          <div ref={calendarRef} className="flex flex-col">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Ирцийн календарь
                </CardTitle>
                <CardDescription>
                  Ирцийн бүртгэлийг харахын тулд огноо сонгоно уу
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) return;
                    if (selectedDate?.toDateString() === date.toDateString())
                      return;
                    setSelectedDate(date);
                  }}
                  className="
                    rounded-md border w-full [&_.rdp-day]:p-0
                    [&_.rdp-day_selected]:bg-slate-800
                    [&_.rdp-day_selected]:text-white
                    [&_.rdp-day_selected]:rounded-full !important
                    [&_.rdp-day_selected]:border-0
                    [&_.rdp-day_selected]:outline-none
                    [&_.rdp-day_selected]:shadow-none
                    [&_.rdp-day:hover]:rounded-full
                  "
                  modifiers={{
                    hasLecture: getLectureDays(),
                  }}
                  modifiersClassNames={{
                    hasLecture:
                      "bg-accent text-accent-foreground rounded-full font-bold hover:bg-slate-100",
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Side Section */}
          {showReport && selectedLecture ? (
            <ViewReport
              lecture={selectedLecture}
              onBack={() => setShowReport(false)}
              setSaveStatus={setSaveStatus}
              handleSave={handleSave}
            />
          ) : (
            <div className="flex flex-col" ref={rightSectionRef}>
              <Card
                className="flex flex-col"
                style={{
                  height: calendarHeight ? `${calendarHeight}px` : "auto",
                }}
              >
                <CardHeader className="flex-shrink-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        {selectedDate?.toLocaleDateString()}-ны хичээлүүд
                      </CardTitle>
                      <CardDescription>
                        {selectedDateAttendance.length > 0
                          ? `${selectedDateAttendance.length} хичээл олдлоо`
                          : "Энэ өдөр хичээл олдсонгүй"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  {selectedDateAttendance.length > 0 ? (
                    <div className="h-full overflow-y-auto space-y-4 pr-2">
                      {selectedDateAttendance.map((lecture) => (
                        <div
                          key={lecture.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group gap-4"
                          // className="flex items-center justify-between p-4 border rounded-lg"
                          title="View Report"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-3 h-12 rounded-full bg-slate-700 flex-shrink-0" />
                            <div className="min-w-0">
                              <h3 className="font-medium text-card-foreground truncate">
                                {lecture.lectureName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {lecture.lectureDate}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
                            <div className="text-right sm:flex-initial">
                              <p className="text-xs text-muted-foreground mt-1">
                                {lecture.presentStudents}/
                                {lecture.totalStudents} сурагч
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedLecture(lecture);
                                setShowReport(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              {windowWidth < 768 || rightSectionWidth > 460 ? ( // 📱 mobile бол үргэлж текст харуулна
                                <span>Дэлгэрэнгүй харах</span>
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Энэ өдөр хичээл олдсонгүй.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Chart Section */}
        <div className="mt-6">
          <AttendanceChart
            data={attendanceData.map((record) => ({
              date: record.date,
              attendanceRate: record.attendanceRate,
              presentStudents: record.presentStudents,
              totalStudents: record.totalStudents,
            }))}
            attendanceData={attendanceData}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
