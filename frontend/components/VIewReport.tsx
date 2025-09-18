"use client"

import { FileText, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
    timestamp?: string
  }[]
}

interface ViewReportProps {
  lecture: AttendanceRecord
  onBack: () => void
}

export function ViewReport({ lecture, onBack }: ViewReportProps) {
  const handlePrintReport = (lecture: AttendanceRecord) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #8b5cf6; padding-bottom: 20px; }
            .header h1 { color: #8b5cf6; margin: 0; }
            .header h2 { color: #666; margin: 5px 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-card { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #8b5cf6; }
            .info-card h3 { margin: 0 0 10px 0; color: #8b5cf6; }
            .info-card p { margin: 5px 0; }
            .students-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .students-table th, .students-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            .students-table th { background: #8b5cf6; color: white; }
            .students-table tr:nth-child(even) { background: #f8fafc; }
            .status-present { color: #059669; font-weight: bold; }
            .status-late { color: #d97706; font-weight: bold; }
            .status-absent { color: #dc2626; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
         
          
          <div class="info-grid">
            <div>
              <p><strong>Хичээлийн нэр:</strong> ${lecture.lectureName}</p>
              <p><strong>Огноо:</strong> ${new Date(lecture.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p><strong>QR эхлүүлсэн цаг:</strong> ${lecture.qrStartTime}</p>
              <p><strong>QR дуусгасан цаг:</strong> ${lecture.qrEndTime}</p>
            </div>
          </div>

          <h3>Оюутны ирц (${lecture.presentStudents}/${lecture.totalStudents} оюутан ирсэн)</h3>
          <table class="students-table">
            <thead>
              <tr>
                <th>Оюутны нэр</th>
                <th>Оюутны код</th>
                <th>Бүртгүүлсэн цаг</th>
              </tr>
            </thead>
            <tbody>
              ${lecture.students
                .sort((a, b) => {
                  return a.name.localeCompare(b.name)
                })
                .map(
                  (student) => `
                  <tr>
                    <td>${student.name}</td>
                    <td>${student.code}</td>
                    <td>${student.timestamp || "-"}</td>
                  </tr>
                `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Хичээлийн ирц
            </CardTitle>
            <CardDescription>
              {lecture.lectureName} хичээлийн ирцийн мэдээлэл
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
            Түүх рүү буцах
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Lecture Information Header */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-700">Хичээлийн мэдээлэл</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Хичээлийн нэр:</span>
                  <span className="font-medium">{lecture.lectureName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Огноо:</span>
                  <span className="font-medium">{new Date(lecture.date).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-700">QR код</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Эхлүүлсэн цаг:</span>
                  <span className="font-medium">{lecture.qrStartTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Дуусгасан цаг:</span>
                  <span className="font-medium">{lecture.qrEndTime}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Print Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold">
              Оюутны ирц ({lecture.presentStudents}/{lecture.totalStudents} оюутан ирсэн)
            </h3>
            <Button onClick={() => handlePrintReport(lecture)} className="gap-2 w-full sm:w-auto">
              <Printer className="w-4 h-4" />
              Тайлан хэвлэх
            </Button>
          </div>

          {/* Students Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Оюутны нэр</th>
                      <th className="text-left p-4 font-medium">Оюутны дугаар</th>
                      <th className="text-left p-4 font-medium">Бүртгүүлсэн цаг</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lecture.students
                      .sort((a, b) => {
                        return a.name.localeCompare(b.name)
                      })
                      .map((student, index) => (
                        <tr
                          key={student.id}
                          className={`border-b hover:bg-muted/30 ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={student.photo || "/placeholder.svg"} />
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
                          <td className="p-4 text-muted-foreground">{student.code}</td>
                          <td className="p-4 text-muted-foreground">{student.timestamp || "-"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}