"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Qr from "./Qr";
import { PiPProviderHandle } from "@/utils/PiPProvider";
import { Users } from "lucide-react";

interface Student {
  _id: string;
  studentName: string;
  studentId: string;
  time: string;
  faceImage?: string | null; 
}

interface QrAndAttendanceProps {
  qrData: string;
  countdown: number;
  open: boolean;
  totalStudents: number; 
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
  totalStudents
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
          {pipActive && (
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
              className="bg-gray-700 text-white"
              disabled={!qrData}
            >
              QR PiP нээх
            </Button>
          ) : (
            <Button
              onClick={() => pipProviderRef.current?.closePiP()}
              className="bg-red-600 text-white"
            >
              QR PiP хаах
            </Button>
          )}
        </div>
      </div>

      {/* Ирцийн жагсаалт with Face Images */}
      <Card className="flex-1">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Ирцэд бүртгүүлсэн оюутнууд
            </h3>
            <div className="flex flex-col items-end gap-1">
              <div className="text-sm font-semibold text-gray-900">
                <span className="text-green-600">{students.length}</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-gray-600">{totalStudents}</span>
              </div>
              <div className="text-xs text-gray-500">
                {students.length} ирсэн
              </div>
            </div>
          </div>
          
          <div className="max-h-[600px] overflow-y-auto space-y-2">
            {students.length > 0 ? (
              students.map((student) => (
                <div
                  key={student._id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors hover:shadow-sm"
                >
                  {/* Face Image */}
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 flex-shrink-0 shadow-sm">
                    {student.faceImage ? (
                      <img
                        src={student.faceImage}
                        alt={student.studentName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-lg font-bold">
                        {student.studentName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate text-sm">
                      {student.studentName}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      {student.studentId}
                    </p>
                  </div>
                  
                  {/* Time Badge */}
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                      Ирсэн
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      {new Date(student.time).toLocaleTimeString('mn-MN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Одоогоор ирц бүртгэгдээгүй байна</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}