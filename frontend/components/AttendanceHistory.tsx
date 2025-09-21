"use client"

import { useEffect, useState } from "react"
import { CalendarIcon, History, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ViewReport } from "./VIewReport"
import { axiosInstance } from "@/lib/utils"
import { AttendanceChart } from "./AttendanceChart"

interface AttendanceRecord {
  id: number
  lectureName: string
  lectureDate: string
  date: string
  startTime: string
  endTime: string
  qrStartTime: string
  qrEndTime: string
  totalStudents: number
  presentStudents: number
  attendanceRate: number
  students: {
    id: number
    name: string
    code: string
    photo: string
    timestamp?: string
  }[]
}

export function AttendanceHistory() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]) // ⬅️ эхэнд зарлана
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedLecture, setSelectedLecture] = useState<AttendanceRecord | null>(null)
  const [showReport, setShowReport] = useState(false)

  const getAttendanceForDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const dateString = `${year}-${month}-${day}`
    return attendanceData.filter((record) => record.date === dateString)
  }

  const selectedDateAttendance = selectedDate ? getAttendanceForDate(selectedDate) : []

  const getLectureDays = () => {
    return attendanceData.map((record) => new Date(record.date))
  }

  const transformApiData = (classrooms: any[]): AttendanceRecord[] => {
    return classrooms.flatMap((classroom) => {
      return classroom.attendanceHistory.map((history: any) => {
        const dateObj = new Date(history.date)
        const year = dateObj.getFullYear()
        const month = String(dateObj.getMonth() + 1).padStart(2, "0")
        const day = String(dateObj.getDate()).padStart(2, "0")
        // Ирсэн оюутнуудын ID жагсаалт
        const attendedIds = history.attendingStudents.map((att: any) => att.student.studentId)

        // Бүх сурагчийг шалгаж багтаана
        const students = classroom.ClassroomStudents.map((student: any) => {
          const attended = history.attendingStudents.find(
            (att: any) => att.student.studentId === student.studentId
          )
          return {
            id: student._id,
            name: student.name,
            code: student.studentId,
            // photo: "/diverse-students.png",
            timestamp: attended ? new Date(attended.attendedAt).toLocaleTimeString() : null,
          }
        })
        return {
          id: history._id,
          lectureName: classroom.lectureName,
          lectureDate: classroom.lectureDate,
          date: `${year}-${month}-${day}`,
          qrStartTime: new Date(history.date).toLocaleTimeString(),
          qrEndTime: history.endedAt ? new Date(history.endedAt).toLocaleTimeString() : "--",
          totalStudents: classroom.ClassroomStudents.length,
          presentStudents: history.totalAttending ?? history.attendingStudents.length,
          attendanceRate: classroom.ClassroomStudents.length
            ? Math.round(
              ((history.totalAttending ?? history.attendingStudents.length) /
                classroom.ClassroomStudents.length) * 100
            )
            : 0,

          students,
        }
      })
    })
  }

  useEffect(() => {
    const teacherId = localStorage.getItem("teacherId")
    if (!teacherId) return

    axiosInstance
      .get(`teacher/classrooms/${teacherId}`)
      .then((res) => {
        const transformed = transformApiData(res.data.classrooms)
        setAttendanceData(transformed)
      })
      .catch((err) => console.error("Error fetching data:", err))
  }, [])

  useEffect(() => {
    if (selectedDateAttendance.length > 0) {
      setSelectedLecture(selectedDateAttendance[0])
      setShowReport(false)
    } else {
      setSelectedLecture(null)
      setShowReport(false)
    }
  }, [selectedDate])
  return (
    <TooltipProvider>

      <div className="w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Ирцийн календарь
                </CardTitle>
                <CardDescription>Ирцийн бүртгэлийг харахын тулд огноо сонгоно уу</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) return;
                    // Хэрвээ дахин дарж байгаа бол state update хийхгүй
                    if (selectedDate?.toDateString() === date.toDateString()) return;
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
                      'bg-slate-700 text-white rounded-full font-bold hover:bg-slate-800',
                  }}
                />
              </CardContent>
            </Card>
            {/* Calendar-ийн доор ирцийн chart */}
            <div className="mt-6">
              <AttendanceChart
                data={attendanceData.map((record) => ({
                  date: record.date,
                  attendanceRate: record.attendanceRate,
                }))}
              />
            </div>
          </div>
          {showReport && selectedLecture ? (
            <ViewReport
              lecture={selectedLecture}
              onBack={() => setShowReport(false)}
            />
          ) : (
            <div>
              {/* Lectures Section */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        {selectedDate?.toLocaleDateString()}-ны хичээлүүд
                      </CardTitle>
                      <CardDescription>
                        {selectedDateAttendance.length > 0
                          ? `${selectedDateAttendance.length} хичээл олдлоо`
                          : "Энэ өдөрт хичээл олдсонгүй"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedDateAttendance.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDateAttendance.map((lecture) => (
                        <div
                          key={lecture.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group gap-4"
                          title="View Report"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-3 h-12 rounded-full bg-slate-700 flex-shrink-0" />
                            <div className="min-w-0">
                              <h3 className="font-medium text-card-foreground truncate">{lecture.lectureName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {lecture.lectureDate}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
                            <div className="text-right sm:flex-initial">
                              <p className="text-xs text-muted-foreground mt-1">
                                {lecture.presentStudents}/{lecture.totalStudents} сурагч
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedLecture(lecture)
                                setShowReport(true)
                              }}
                            >
                              <span >Дэлгэрэнгүй харах</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Энэ өдөрт хичээл олдсонгүй.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>)}
        </div>

      </div>
    </TooltipProvider >
  )
}