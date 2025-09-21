"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, Play, Square, QrCode } from "lucide-react";
import JoinLinkQrButton from "./JoinLinkQrButton";

interface Classroom {
  _id: string;
  lectureName: string;
  joinLink?: string;
}

interface AttendanceControlPanelProps {
  classrooms: Classroom[];
  selectedClassroomId: string;
  selectedLectureName: string;
  loading: boolean;
  running: boolean;
  joinLinkQr: string | null;
  onClassroomChange: (id: string) => void;
  start: () => void;
  stop: () => void;
}

export default function AttendanceControlPanel({
  classrooms,
  selectedClassroomId,
  selectedLectureName,
  loading,
  running,
  joinLinkQr,
  onClassroomChange,
  start,
  stop,
}: AttendanceControlPanelProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Control Panel */}
      <Card className="flex-1 shadow-xl rounded-2xl bg-white border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-slate-700">
            <QrCode className="w-6 h-6" />
            Сурагчдын ирцийг хянах QR код
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="relative w-full sm:w-64">
            <select
              className="w-full px-4 py-2 border rounded-xl shadow-sm bg-white text-gray-800 appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              value={selectedClassroomId}
              onChange={(e) => onClassroomChange(e.target.value)}
            >
              <option value="">Ангийг сонгоно уу</option>
              {classrooms.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.lectureName}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <ChevronDown color="gray" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={start}
              disabled={!selectedLectureName || loading || running}
              className="flex items-center gap-2 bg-slate-700 text-white"
            >
              <Play className="w-4 h-4" />
              {loading ? "Хүлээнэ үү..." : "QR үүсгэх"}
            </Button>
            <Button
              onClick={stop}
              disabled={!running}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Зогсоох
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="w-full lg:w-120 flex items-center justify-center bg-gray-50 p-6 rounded-2xl shadow-xl border">
        <JoinLinkQrButton joinLinkQr={joinLinkQr} />
      </div>
    </div>
  );
}
