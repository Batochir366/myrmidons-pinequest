"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronDown,
  Play,
  Square,
  QrCode,
  Copy,
  EyeOff,
  Eye,
} from "lucide-react";
import JoinLinkQrButton from "./JoinLinkQrButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useState } from "react";

interface Classroom {
  _id: string;
  lectureName: string;
  joinLink?: string;
  lectureDate?: string;
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
  const [showQr, setShowQr] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Control Panel */}
      <Card className="flex-1 rounded-2xl bg-white border shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-slate-700">
            <QrCode className="w-6 h-6" />
            Сурагчдын ирцийг хянах QR код
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="relative max-w-[376px] w-full">
            <Select
              value={selectedClassroomId}
              onValueChange={(value) => onClassroomChange(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Ангийг сонгоно уу" />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((c) => (
                  <SelectItem className="" key={c._id} value={c._id}>
                    <div className="flex justify-between w-[320px]">
                      <span>{c.lectureName}</span>
                      <span className="text-muted-foreground">
                        {c.lectureDate}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

            {/* QR Toggle Button */}
            <Button
              onClick={() => setShowQr(!showQr)}
              className="bg-slate-700 text-white gap-2"
            >
              {showQr ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {showQr ? "QR нуух" : "QR харуулах"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="w-full lg:w-120 flex items-center justify-center rounded-2xl border">
        <JoinLinkQrButton joinLinkQr={joinLinkQr} showQr={showQr} />
      </div>
    </div>
  );
}
