"use client";

import { useState } from "react";
import { CalendarIcon, Eye, FileText, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TooltipProvider } from "@/components/ui/tooltip";
const selectedDateAttendance = [] as any;
interface AttendanceRecord {
  id: number;
  lectureName: string;
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
    status: "present" | "late" | "absent";
    timestamp?: string;
  }[];
}

export function AttendanceHistory() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedLecture, setSelectedLecture] =
    useState<AttendanceRecord | null>(null);
  const [showReport, setShowReport] = useState(false);

  const ReportView = ({ lecture }: { lecture: AttendanceRecord }) => (
    <div className="space-y-6">
      {/* Lecture Information Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-700">
              Хичээлийн мэдээлэл
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Хичээлийн нэр:</span>
              <span className="font-medium">{lecture.lectureName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Огноо:</span>
              <span className="font-medium">
                {new Date(lecture.date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Цаг:</span>
              <span className="font-medium">
                {lecture.startTime} - {lecture.endTime}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-700">
              QR кодын сесс
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">QR эхлэх цаг:</span>
              <span className="font-medium">{lecture.qrStartTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">QR дуусах цаг:</span>
              <span className="font-medium">{lecture.qrEndTime}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Button */}

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Сурагчийн нэр</th>
                  <th className="text-left p-4 font-medium">
                    Сурагчийн дугаар
                  </th>
                  <th className="text-left p-4 font-medium">Ирсэн цаг</th>
                </tr>
              </thead>
              <tbody>
                {lecture.students
                  .sort((a, b) => {
                    if (
                      a.status === "present" &&
                      a.timestamp &&
                      b.status === "present" &&
                      b.timestamp
                    ) {
                      return a.timestamp.localeCompare(b.timestamp);
                    }
                    return a.name.localeCompare(b.name);
                  })
                  .map((student, index) => (
                    <tr
                      key={student.id}
                      className={`border-b hover:bg-muted/30 ${
                        index % 2 === 0 ? "bg-background" : "bg-muted/20"
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage
                              src={student.photo || "/placeholder.svg"}
                            />
                            <AvatarFallback className="text-xs">
                              {student.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {student.code}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {student.timestamp || "-"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2 xl:col-span-1">
            <Card>
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
                  onSelect={setSelectedDate}
                  className="rounded-md border w-full"
                  modifiers={{
                    hasLecture: [],
                    hasExam: [], // Can be extended for exams
                    holiday: [], // Can be extended for holidays
                  }}
                  modifiersClassNames={{
                    hasLecture:
                      "bg-slate-700 text-white rounded-full font-bold hover:bg-slate-800",
                    hasExam:
                      "bg-red-500 text-white rounded-full font-bold hover:bg-red-600",
                    holiday:
                      "bg-gray-400 text-white rounded-full hover:bg-gray-500",
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Lectures and Reports Section */}
          <div className="lg:col-span-3 xl:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {showReport && selectedLecture ? (
                        <>
                          <FileText className="w-5 h-5" />
                          Хичээлийн тайлан
                        </>
                      ) : (
                        <>
                          <History className="w-5 h-5" />
                          {selectedDate?.toLocaleDateString()}-ны хичээлүүд
                        </>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {/* {showReport && selectedLecture
                        ? `${selectedLecture.lectureName}-ийн дэлгэрэнгүй ирцийн тайлан`
                        : selectedDateAttendance.length > 0
                        ? `${selectedDateAttendance.length} хичээл олдлоо`
                        : "Энэ өдөрт хичээл олдсонгүй"} */}
                    </CardDescription>
                  </div>
                  {showReport && (
                    <Button
                      variant="outline"
                      onClick={() => setShowReport(false)}
                      className="w-full sm:w-auto"
                    >
                      Түүх рүү буцах
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {showReport && selectedLecture ? (
                  <ReportView lecture={selectedLecture} />
                ) : selectedDateAttendance.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDateAttendance.map((lecture: any) => (
                      <div
                        key={lecture.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group gap-4"
                        title="View Report"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-3 h-12 rounded-full bg-slate-700 flex-shrink-0" />
                          <div className="min-w-0">
                            <h3 className="font-medium text-card-foreground truncate">
                              {lecture.lectureName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {lecture.startTime} - {lecture.endTime}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="text-right flex-1 sm:flex-initial">
                            <p className="text-xs text-muted-foreground mt-1">
                              {lecture.totalStudents} сурагч
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLecture(lecture);
                              setShowReport(true);
                            }}
                            className="bg-transparent opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">
                              Тайлан харах
                            </span>
                            <span className="sm:hidden">Харах</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Энэ өдөрт хичээл олдсонгүй.</p>
                    <p className="text-sm">
                      Өөр огноо сонгох эсвэл шинэ хичээл үүсгэнэ үү.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
