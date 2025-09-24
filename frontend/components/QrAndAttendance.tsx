"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Qr from "./Qr";
import { PiPProviderHandle } from "@/utils/PiPProvider";
interface Student {
  _id: string;
  studentName: string;
  studentId: string;
  time: string;
}

interface QrAndAttendanceProps {
  qrData: string;
  countdown: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  students: Student[];
  qrSec: number;
  pipProviderRef: React.RefObject<PiPProviderHandle>;
  pipActive: boolean;
  setQrSvg: React.Dispatch<React.SetStateAction<string>>;
}

export default function QrAndAttendance({
  qrData,
  countdown,
  open,
  setOpen,
  students,
  setQrSvg,
  pipProviderRef,
  pipActive,
}: QrAndAttendanceProps) {
  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* QR код хэсэг */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-white to-slate-50 p-6 shadow-xl border relative">
        <div className="relative group">
          <div
            id="main-qr-container"
            className="w-80 h-80 sm:w-96 sm:h-96 rounded-xl shadow-lg cursor-pointer transition-transform group-hover:scale-105"
            onClick={() => setOpen(true)}
          >
            <Qr
              qrData={qrData}
              className="w-full h-full"
              onQrReady={setQrSvg}
            />
          </div>

          {/* Countdown overlay */}
          <div className="absolute top-[-10px] right-[-10px] bg-black/70 text-white px-2 py-1 rounded text-xs sm:text-sm font-mono">
            {countdown}s
          </div>

          {/* PiP status indicator */}
          {pipActive && ( // Use pipActive to conditionally render the status indicator
            <div className="absolute top-[-10px] left-[-10px] bg-green-600/90 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
              PiP
            </div>
          )}
        </div>

        {/* Full screen QR modal */}
        {open && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-[90%] max-w-[600px] h-[90%] max-h-[600px]"
              onClick={(e) => e.stopPropagation()}
            >
              <Qr qrData={qrData} className="w-full h-full" />
            </div>
          </div>
        )}

        {/* PiP Controls */}
        <div className="flex mt-4 items-center gap-2">
          {!pipActive ? (
            <Button
              onClick={() => pipProviderRef.current?.openPiP()}
              className="bg-gray-700 text-white ..."
              disabled={!qrData}
            >
              QR PiP нээх
            </Button>
          ) : (
            <Button
              onClick={() => pipProviderRef.current?.closePiP()}
              className="bg-red-600 text-white ..."
            >
              QR PiP хаах
            </Button>
          )}
        </div>
      </div>

      {/* Ирцийн жагсаалт */}
      <Card className="flex-1">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Ирцэд бүртгүүлсэн оюутнууд
            </h3>
            <div className="text-sm text-muted-foreground">
              Нийт: {students.length} оюутан
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 pl-3 font-medium">Оюутны нэр</th>
                  <th className="text-left p-4 font-medium">Оюутны код</th>
                  <th className="text-left p-4 font-medium">Бүртгүүлсэн цаг</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.map((student, index) => (
                    <tr
                      key={student._id}
                      className={`border-b hover:bg-muted/30 transition-colors ${
                        index % 2 === 0 ? "bg-background" : "bg-muted/20"
                      }`}
                    >
                      <td className="p-4 font-medium">{student.studentName}</td>
                      <td className="p-4 text-muted-foreground">
                        {student.studentId}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(student.time).toLocaleTimeString("mn-MN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="text-center py-20 text-muted-foreground"
                    >
                      Одоогоор ирц бүртгэгдээгүй байна
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
