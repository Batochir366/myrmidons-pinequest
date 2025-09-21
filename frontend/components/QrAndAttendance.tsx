"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

  // Picture-in-Picture QR
  const openPiP = async () => {
    if (!canvasRef.current || !videoRef.current || !qrImage) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    const stream = canvas.captureStream();
    const [track] = stream.getVideoTracks();
    const pipWindow = new MediaStream([track]);

    video.srcObject = pipWindow;
    await video.play();
    await video.requestPictureInPicture();

    video.onleavepictureinpicture = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  };

  // 🔄 QR зураг өөрчлөгдөх бүрд canvas дээр зурна
  useEffect(() => {
    if (!canvasRef.current || !qrImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    const drawQr = () => {
      const img = new Image();
      img.src = qrImage;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    };

    drawQr();

    // 5 сек тутам автоматаар шинэчлэх
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(drawQr, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [qrImage]);

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* QR code section */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-white to-slate-50 p-6 rounded-2xl shadow-xl border relative">
        <div className="relative group">
          <img
            src={qrImage}
            alt="QR Code"
            className="w-100 h-100 sm:w-140 sm:h-140 rounded-xl shadow-lg cursor-pointer transition-transform group-hover:scale-105"
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
              className="w-[90%] max-w-2xl rounded-xl shadow-2xl"
            />
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-6 mt-4">
          <Button onClick={openPiP} className="bg-gray-700 text-white">
            QR жижгээр нээх
          </Button>
          <video
            ref={videoRef}
            style={{ display: "none", width: 400, height: 400 }}
            muted
            playsInline
          />
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            style={{ display: "none" }}
          />

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

      {/* Attendance table section */}
      <Card className="flex-1">
        <CardContent className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 pl-3 font-medium">Оюутны нэр</th>
                  <th className="text-left p-4 font-medium">Оюутны дугаар</th>
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
                      <td className="p-4">
                        <span className="font-medium">
                          {student.studentName}
                        </span>
                      </td>
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
                      className="text-center py-60 text-muted-foreground"
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
