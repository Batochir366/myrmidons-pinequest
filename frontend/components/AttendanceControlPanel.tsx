"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Square, QrCode } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// -----------------------------
// Interfaces
// -----------------------------

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
  qrSec: number;
  handlesave: (newSec: number) => void;
}

// -----------------------------
// Component
// -----------------------------

export default function AttendanceControlPanel({
  classrooms,
  selectedClassroomId,
  selectedLectureName,
  loading,
  running,
  onClassroomChange,
  start,
  stop,
  qrSec,
  handlesave,
}: AttendanceControlPanelProps) {
  const [inputValue, setInputValue] = useState(qrSec.toString());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="flex flex-col gap-6 w-full lg:flex-row">
      <Card className="flex-1 rounded-2xl bg-white border shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-slate-700">
            <QrCode className="w-6 h-6" />
            Сурагчдын ирцийг хянах QR код
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
            {/* Ангийн сонголт */}
            <div className="w-full sm:max-w-[376px]">
              <Select
                value={selectedClassroomId}
                onValueChange={onClassroomChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ангийг сонгоно уу" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      <div className="flex justify-between items-center w-[320px] sm:w-full gap-x-2">
                        <span className="font-medium">{c.lectureName}</span>
                        <span className="text-muted-foreground text-sm">
                          {c.lectureDate}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start / Stop / QR секунд */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto">
              <Button
                onClick={start}
                disabled={!selectedLectureName || loading || running}
                className="flex-1 w-[137px] sm:flex-none flex items-center gap-2 bg-slate-700 text-white"
              >
                <Play className="w-4 h-4" />
                {loading ? "Хүлээнэ үү..." : "QR үүсгэх"}
              </Button>

              <Button
                onClick={stop}
                disabled={!running}
                variant="destructive"
                className="w-[137px] sm:flex-none flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Зогсоох
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none bg-black text-white"
                  >
                    QR-ын хугацаа
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>QR шинэчлэгдэх хугацаа</DialogTitle>
                  </DialogHeader>

                  <div className="grid gap-3">
                    <Label htmlFor="qr-sec">
                      Та QR шинэчлэгдэх хугацааг бичнэ үү (хамгийн багадаа 3
                      секунд)
                    </Label>
                    <Input
                      id="qr-sec"
                      type="number"
                      value={inputValue}
                      onChange={handleChange}
                      min={3}
                    />
                  </div>

                  <DialogFooter className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>

                    <DialogClose asChild>
                      <Button onClick={() => handlesave(Number(inputValue))}>
                        Save
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
