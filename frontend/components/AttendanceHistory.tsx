"use client"

import { useEffect, useState } from "react"
import { CalendarIcon, History, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ViewReport } from "./VIewReport"
import { axiosInstance } from "@/lib/utils"

interface AttendanceRecord {
  id: number
  lectureName: string
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
    status: "present" | "late" | "absent"
    timestamp?: string
  }[]
}

const sampleAttendanceData: AttendanceRecord[] = [
  {
    id: 1,
    lectureName: "Financial Accounting",
    date: "2025-09-16",
    startTime: "08:50",
    endTime: "09:30",
    qrStartTime: "08:50",
    qrEndTime: "09:30",
    totalStudents: 45,
    presentStudents: 42,
    attendanceRate: 93,
    students: [
      {
        id: 1,
        name: "Sarah Johnson",
        code: "ACC2021001",
        photo: "/diverse-students.png",
        status: "present",
        timestamp: "08:52",
      },
      {
        id: 2,
        name: "Michael Chen",
        code: "ACC2021002",
        photo: "/diverse-students.png",
        status: "present",
        timestamp: "08:53",
      },
      {
        id: 3,
        name: "Emma Davis",
        code: "ACC2021003",
        photo: "/diverse-students.png",
        status: "late",
        timestamp: "09:15",
      },
      {
        id: 4,
        name: "James Wilson",
        code: "ACC2021004",
        photo: "/diverse-students.png",
        status: "absent",
      },
      {
        id: 5,
        name: "Lisa Anderson",
        code: "ACC2021005",
        photo: "/diverse-students.png",
        status: "present",
        timestamp: "08:51",
      },
    ],
  },
  {
    id: 2,
    lectureName: "Mathematics 201",
    date: "2025-09-14",
    startTime: "10:00",
    endTime: "11:30",
    qrStartTime: "10:00",
    qrEndTime: "11:30",
    totalStudents: 24,
    presentStudents: 24,
    attendanceRate: 100,
    students: [
      {
        id: 1,
        name: "Sarah Johnson",
        code: "CS2021001",
        photo: "/diverse-students.png",
        status: "present",
        timestamp: "10:02",
      },
      {
        id: 2,
        name: "Мишээл",
        code: "CS2021002",
        photo: "/diverse-students.png",
        status: "present",
        timestamp: "10:01",
      },
    ],
  },
  {
    id: 3,
    lectureName: "Physics 301",
    date: "2025-09-15",
    startTime: "12:00",
    endTime: "13:30",
    qrStartTime: "12:00",
    qrEndTime: "13:30",
    totalStudents: 32,
    presentStudents: 30,
    attendanceRate: 94,
    students: [],
  },
]

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

        return {
          id: history._id,
          lectureName: classroom.lectureName,
          date: `${year}-${month}-${day}`,
          startTime: classroom.lectureDate.split(" ")[0],
          endTime: classroom.lectureDate.split(" ")[1],
          qrStartTime: classroom.lectureDate.split(" ")[0],
          qrEndTime: classroom.lectureDate.split(" ")[1],
          totalStudents: classroom.ClassroomStudents.length,
          presentStudents: history.totalAttending ?? history.attendingStudents.length,
          attendanceRate: classroom.ClassroomStudents.length
            ? Math.round(
              ((history.totalAttending ?? history.attendingStudents.length) /
                classroom.ClassroomStudents.length) * 100
            )
            : 0,
          students: history.attendingStudents.map((att: any) => ({
            id: att.student._id,
            name: att.student.name,
            code: att.student.studentId,
            photo: "/diverse-students.png", // backend-д зураг байхгүй тул түр placeholder
            timestamp: new Date(att.attendedAt).toLocaleTimeString(),
          })),
        }
      })
    })
  }

  useEffect(() => {
    const teacherId = localStorage.getItem("teacherId")
    if (!teacherId) return

    axiosInstance
      // .get(`teacher/classrooms/${teacherId}`)
      .get(`teacher/classrooms/68cf9442078a17ed12ddac55`)
      .then((res) => {
        const transformed = transformApiData(res.data.classrooms)
        setAttendanceData(transformed)
      })
      .catch((err) => console.error("Error fetching data:", err))
  }, [])

  useEffect(() => {
    if (selectedDateAttendance.length === 0) {
      setShowReport(false)
      setSelectedLecture(null)
    }
  }, [selectedDateAttendance])

  useEffect(() => {
    if (selectedDateAttendance.length > 0) {
      setSelectedLecture(selectedDateAttendance[0])
      setShowReport(true)
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
                  onSelect={setSelectedDate}
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
                                {lecture.startTime} - {lecture.endTime}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="text-right sm:flex-initial">
                              <p className="text-xs text-muted-foreground mt-1">{lecture.totalStudents} сурагч</p>
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