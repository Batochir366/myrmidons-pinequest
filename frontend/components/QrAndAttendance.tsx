"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Qr from "./Qr";

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const latestQrRef = useRef(qrImage);
  useEffect(() => {
    latestQrRef.current = qrImage;
  }, [qrImage]);

  // PiP нээх
  const openPiP = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    const drawQr = (imgSrc: string) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.src = imgSrc;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    };

    // Эхэнд зурна
    drawQr(latestQrRef.current);

    // Canvas-г video stream-д холбоно
    const stream = canvas.captureStream();
    video.srcObject = stream;
    await video.play();
    await video.requestPictureInPicture();

    // QR-г interval-аар шинэчилнэ
    intervalRef.current = setInterval(() => {
      drawQr(latestQrRef.current);
    }, countdown * 1000);

    video.onleavepictureinpicture = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  };

  // Canvas дээр QR зурж шинэчлэх (PiP болон өөрийн харагдах хэсэгт)
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawQr = (imgSrc: string) => {
      const img = new Image();
      img.src = imgSrc;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    };

    drawQr(latestQrRef.current);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      drawQr(latestQrRef.current);
    }, countdown * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [countdown]);

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* QR код хэсэг */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-white to-slate-50 p-6 shadow-xl border relative">
        <div className="relative group">
          <div
            className="w-80 h-80 sm:w-100 sm:h-100 rounded-xl shadow-lg cursor-pointer transition-transform group-hover:scale-105"
            onClick={() => setOpen(true)}
          >
            <Qr qrData={qrData} />
          </div>

          <div className="absolute top-[-10] right-[-10] bg-black/70 text-white px-2 py-1 rounded text-xs sm:text-sm font-mono">
            {countdown}s
          </div>
        </div>

        {open && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={() => setOpen(false)}
          >
            <Qr qrData={qrData} className="w-[90%] max-w-[800px]" />
          </div>
        )}

        <div className="flex mt-4 items-center gap-2">
          <Button
            onClick={openPiP}
            className="bg-gray-700 text-white flex justify-center"
          >
            QR жижгээр нээх
          </Button>
          <video ref={videoRef} style={{ display: "none" }} muted playsInline />
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            style={{ display: "none" }}
          />
        </div>
      </div>

      {/* Ирцийн жагсаалт */}
      <Card className="flex-1">
        <CardContent className="p-5">
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
                      className={`border-b hover:bg-muted/30 ${
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
