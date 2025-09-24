"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Qr from "./Qr";

interface Student {
  _id: string;
  studentName: string;
  studentId: string;
  time: string;
}

interface PiPState {
  isActive: boolean;
  qrData?: string;
  timestamp: number;
  attendanceId: string;
  qrSec: number;
}

interface QrAndAttendanceProps {
  qrImage: string;
  qrData: string;
  countdown: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  students: Student[];
  qrSec: number;
  onPiPStart?: () => void;
  onPiPStop?: () => void;
  pipState?: PiPState | null;
}

export default function QrAndAttendance({
  qrImage,
  qrData,
  countdown,
  open,
  setOpen,
  students,
  qrSec,
  onPiPStart,
  onPiPStop,
  pipState,
}: QrAndAttendanceProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrSvgRef = useRef<string>("");
  const isPiPActiveRef = useRef<boolean>(false);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);

  const [qrSvg, setQrSvg] = useState<string>("");
  const [pipActive, setPipActive] = useState<boolean>(false);
  const [pipRestored, setPipRestored] = useState<boolean>(false);

  // Enhanced drawing with better error handling and performance
  const drawSvgToCanvas = useCallback(
    (svgString: string) => {
      if (!canvasRef.current || !svgString || !isPiPActiveRef.current) {
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      try {
        // Create offscreen canvas for atomic drawing
        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = canvas.width;
        offscreenCanvas.height = canvas.height;
        const offscreenCtx = offscreenCanvas.getContext("2d");

        if (!offscreenCtx) return;

        // Clear and fill background
        offscreenCtx.fillStyle = "#ffffff";
        offscreenCtx.fillRect(
          0,
          0,
          offscreenCanvas.width,
          offscreenCanvas.height
        );

        // Create image from SVG
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          if (!isPiPActiveRef.current) {
            URL.revokeObjectURL(url);
            return;
          }

          try {
            // Draw QR code
            offscreenCtx.drawImage(
              img,
              0,
              0,
              offscreenCanvas.width,
              offscreenCanvas.height
            );

            // Draw logo overlay
            const logoImg = new Image();
            logoImg.onload = () => {
              if (!isPiPActiveRef.current) return;

              const logoSize =
                Math.min(offscreenCanvas.width, offscreenCanvas.height) * 0.15;
              const x = (offscreenCanvas.width - logoSize) / 2;
              const y = (offscreenCanvas.height - logoSize) / 2;

              // White background for logo
              offscreenCtx.fillStyle = "#ffffff";
              offscreenCtx.fillRect(x - 8, y - 8, logoSize + 16, logoSize + 16);

              // Draw logo
              offscreenCtx.drawImage(logoImg, x, y, logoSize, logoSize);

              // Add countdown text
              offscreenCtx.fillStyle = "#000000";
              offscreenCtx.font = "bold 24px Arial";
              offscreenCtx.textAlign = "center";
              offscreenCtx.fillText(
                `${countdown}s`,
                offscreenCanvas.width - 40,
                40
              );

              // Copy to main canvas atomically
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(offscreenCanvas, 0, 0);
            };

            logoImg.onerror = () => {
              // Copy to main canvas even without logo
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(offscreenCanvas, 0, 0);
            };

            logoImg.src = "/a.png";
          } catch (error) {
            console.error("Error drawing QR to canvas:", error);
          }

          URL.revokeObjectURL(url);
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
        };

        img.src = url;
      } catch (error) {
        console.error("Error in drawSvgToCanvas:", error);
      }
    },
    [countdown]
  );

  // Handle QR SVG ready
  const handleQrReady = useCallback(
    (svg: string) => {
      setQrSvg(svg);
      qrSvgRef.current = svg;

      // Update canvas if PiP is active
      if (isPiPActiveRef.current) {
        setTimeout(() => drawSvgToCanvas(svg), 0);
      }
    },
    [drawSvgToCanvas]
  );

  // Enhanced PiP functionality with restoration
  const openPiP = async () => {
    if (!canvasRef.current || !videoRef.current || !qrSvgRef.current) {
      console.warn("PiP requirements not met");
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;

    try {
      // Mark PiP as active
      isPiPActiveRef.current = true;
      setPipActive(true);

      // Draw initial QR
      drawSvgToCanvas(qrSvgRef.current);

      // Create video stream with optimal settings
      const stream = canvas.captureStream(30);
      video.srcObject = stream;

      // Set video properties for better PiP experience
      video.muted = true;
      video.playsInline = true;
      video.controls = false;

      await video.play();

      if (!document.pictureInPictureEnabled) {
        throw new Error("Picture-in-Picture is not supported");
      }

      // Request PiP
      pipVideoRef.current = video;
      await video.requestPictureInPicture();

      // Handle PiP events
      video.addEventListener("enterpictureinpicture", () => {
        console.log("Entered PiP mode");
        onPiPStart?.();
        setupPiPUpdates();
      });

      video.addEventListener("leavepictureinpicture", () => {
        console.log("Left PiP mode");
        isPiPActiveRef.current = false;
        setPipActive(false);
        cleanupPiP();
        onPiPStop?.();
      });
    } catch (error) {
      isPiPActiveRef.current = false;
      setPipActive(false);
      console.error("PiP error:", error);
      cleanupPiP();
    }
  };

  // Setup automatic PiP updates
  const setupPiPUpdates = useCallback(() => {
    // Clear existing interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    // Update immediately
    if (qrSvgRef.current) {
      drawSvgToCanvas(qrSvgRef.current);
    }

    // Set up regular updates
    updateIntervalRef.current = setInterval(() => {
      if (isPiPActiveRef.current && qrSvgRef.current) {
        drawSvgToCanvas(qrSvgRef.current);
      }
    }, 1000); // Update every second for smooth countdown

    console.log(`PiP update interval configured (${qrSec}s QR cycle)`);
  }, [qrSec, drawSvgToCanvas]);

  // Cleanup PiP resources
  const cleanupPiP = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    pipVideoRef.current = null;
  };

  // Restore PiP if it was active before navigation
  useEffect(() => {
    if (pipState?.isActive && !pipRestored && qrSvgRef.current) {
      console.log("Attempting to restore PiP from previous session...");

      // Small delay to ensure canvas is ready
      setTimeout(() => {
        openPiP();
        setPipRestored(true);
      }, 500);
    }
  }, [pipState, pipRestored]);

  // Update canvas when QR changes (only if PiP is active)
  useEffect(() => {
    if (!qrSvgRef.current || !isPiPActiveRef.current) return;

    const timeoutId = setTimeout(() => {
      drawSvgToCanvas(qrSvgRef.current);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [qrData, qrSvg, countdown, drawSvgToCanvas]);

  // Update PiP when timing changes
  useEffect(() => {
    if (isPiPActiveRef.current) {
      setupPiPUpdates();
    }
  }, [qrSec, setupPiPUpdates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPiPActiveRef.current = false;
      cleanupPiP();
    };
  }, []);

  // Force PiP to close when component unmounts or running stops
  useEffect(() => {
    return () => {
      if (
        pipVideoRef.current &&
        document.pictureInPictureElement === pipVideoRef.current
      ) {
        document.exitPictureInPicture().catch(console.error);
      }
    };
  }, []);
  const closePiP = () => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(console.error);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* QR код хэсэг */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-white to-slate-50 p-6 shadow-xl border relative">
        <div className="relative group">
          <div
            className="w-80 h-80 sm:w-96 sm:h-96 rounded-xl shadow-lg cursor-pointer transition-transform group-hover:scale-105"
            onClick={() => setOpen(true)}
          >
            <Qr
              qrData={qrData}
              className="w-full h-full"
              onQrReady={handleQrReady}
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
              onClick={openPiP}
              className="bg-gray-700 text-white flex justify-center hover:bg-gray-600"
              disabled={!qrSvg}
            >
              QR жижгээр нээх
            </Button>
          ) : (
            <Button
              onClick={closePiP}
              className="bg-red-600 text-white flex justify-center hover:bg-red-700"
            >
              PiP хаах
            </Button>
          )}
          {/* Restored session indicator */}
          {pipState?.isActive && pipRestored && (
            <div className="text-xs text-blue-600 font-medium">
              PiP сэргээгдлээ
            </div>
          )}
        </div>

        {/* Hidden canvas for PiP rendering */}
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          style={{ display: "none" }}
        />

        {/* Hidden video element for PiP */}
        <video
          ref={videoRef}
          style={{ display: "none" }}
          muted
          playsInline
          width={400}
          height={400}
        />
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
