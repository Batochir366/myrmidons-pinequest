"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Clock, Play, QrCode, Square } from "lucide-react";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { useRef } from "react";
export function QRControlCenter() {
  const [lectureName, setLectureName] = useState("");
  const [lectureDate, setLectureDate] = useState("");
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [running, setRunning] = useState(false);

  const timerRef = useRef<NodeJS.Timer | null>(null);

  const generateQr = () => {
    const token = uuidv4();
    const expiresAt = Date.now() + 5000;
    const url = `https://myrmidons-pinequest-backend.vercel.app/scan?token=${token}&expiresAt=${expiresAt}`;
    setQrData(url);

    QRCode.toDataURL(url, { width: 256 }, (err, dataUrl) => {
      if (err) {
        console.error("Error generating QR code:", err);
      } else {
        setQrImage(dataUrl);
      }
    });
  };

  const start = () => {
    if (running) return;
    generateQr();
    setCountdown(5);
    setRunning(true);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          generateQr();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current as any);
      timerRef.current = null;
    }
    setRunning(false);
    setQrData(null); // QR код устгах
    setQrImage(null); // Зураг устгах
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current as any);
    };
  }, []);

  ////////////////////////////////////////////////////

  const progressPercentage = ((5 - countdown) / 5) * 100;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6">
      {/* QR Control Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR ирц удирдлага
          </CardTitle>
          <CardDescription>
            Сурагчдын ирцийг хянах QR код үүсгэх
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lectureName">Хичээлийн нэр</Label>
              <Input
                id="lectureName"
                placeholder="жишээ нь: Компьютерийн ухаан 101"
                value={lectureName}
                onChange={(e) => setLectureName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lectureDate">Хичээлийн огноо</Label>
              <Input
                id="lectureDate"
                type="date"
                value={lectureDate}
                onChange={(e) => setLectureDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => start()}
              disabled={!lectureName || !lectureDate}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white"
            >
              <Play className="w-4 h-4" />
              QR үүсгэх
            </Button>
            <Button
              disabled={!running}
              onClick={() => stop()}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              QR зогсоох
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* QR Display Card */}
      {running && lectureName && lectureDate && (
        <Card className="border-slate-200 bg-slate-50/50">
          <CardContent className="p-8">
            <div className="flex flex-col xl:flex-row items-center gap-8">
              <div className="flex-1 space-y-4">
                <div className="text-center xl:text-left">
                  {running && qrData && qrImage && (
                    <div className="flex flex-col items-center mb-6">
                      <img
                        src={qrImage}
                        alt="QR Code"
                        className="w-64 h-64 rounded-lg shadow-lg mb-4"
                      />
                      <div className="text-xs text-gray-600 break-all max-w-xs bg-white p-2 rounded shadow">
                        <a
                          href={qrData}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          {qrData}
                        </a>
                      </div>
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-card-foreground">
                    {lectureName}
                  </h3>
                  <p className="text-muted-foreground">{lectureDate}</p>
                </div>
                {/* 
                <div className="space-y-2">
                  <Progress value={progressPercentage} className="h-2" />
                </div> */}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{new Date().toLocaleTimeString()}-д эхэлсэн</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
