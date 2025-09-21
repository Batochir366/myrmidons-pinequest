"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface Student {
  _id: string;
  studentName: string;
  studentId: string;
  time: string;
}

interface QrAndAttendanceProps {
  qrImage: string;
  qrData: string;
  countdown: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  students: Student[];
}

export default function QrAndAttendance({
  qrImage,
  qrData,
  countdown,
  open,
  setOpen,
  students,
}: QrAndAttendanceProps) {
  return (
    <div className="flex flex-col xl:flex-row gap-6">
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-white to-slate-50 p-6 rounded-2xl shadow-xl border relative">
        <div className="relative group">
          <img
            src={qrImage}
            alt="QR Code"
            className="w-48 sm:w-64 h-48 sm:h-64 rounded-xl shadow-lg cursor-pointer transition-transform group-hover:scale-105"
            onClick={() => setOpen(true)}
          />
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs sm:text-sm font-mono">
            {countdown}s
          </div>
        </div>

        {open && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={() => setOpen(false)}
          >
            <img
              src={qrImage}
              alt="QR Code"
              className="w-[90%] max-w-4xl rounded-xl shadow-2xl"
            />
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 mt-4">
          <Button className="bg-indigo-600 text-white">QR жижгээр нээх</Button>
          <Button
            onClick={() =>
              qrData && window.open(qrData, "_blank", "noopener,noreferrer")
            }
            className="bg-gray-700 text-white"
          >
            QR ирц өгөхөөр нээх
          </Button>
        </div>
      </div>

      <Card className="flex-1 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5" /> Ирсэн сурагчид ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto max-h-[400px] sm:max-h-[500px]">
          {students.length === 0 ? (
            <p className="text-center text-gray-500">
              Одоогоор сурагч ирээгүй байна
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 px-2">Нэр</th>
                  <th className="py-2 px-2">ID</th>
                  <th className="py-2 px-2">Ирсэн цаг</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr
                    key={s._id}
                    className="hover:bg-slate-100 transition-colors"
                  >
                    <td className="py-2 px-2 font-medium text-slate-800">
                      {s.studentName}
                    </td>
                    <td className="py-2 px-2 text-gray-500">{s.studentId}</td>
                    <td className="py-2 px-2 text-gray-500">
                      {new Date(s.time).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
