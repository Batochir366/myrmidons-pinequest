"use client";

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

interface PiPProviderProps {
  qrSvg: string;
  qrSec: number;
  onPiPStart?: () => void;
  onPiPStop?: () => void;
}

export interface PiPProviderHandle {
  openPiP: () => Promise<void>;
  closePiP: () => void;
  isActive: boolean;
}

export const PiPProvider = forwardRef<PiPProviderHandle, PiPProviderProps>(
  ({ qrSvg, qrSec, onPiPStart, onPiPStop }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const offscreenCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isPiPActiveRef = useRef(false);
    const [isActive, setIsActive] = useState(false);
    const drawingRef = useRef(false);

    useEffect(() => {
      offscreenCanvasRef.current = document.createElement("canvas");
      offscreenCanvasRef.current.width = 400;
      offscreenCanvasRef.current.height = 400;
    }, []);

    // Draw the provided SVG to offscreen canvas (full QR only)
    const drawToOffscreen = useCallback((): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!offscreenCanvasRef.current || !qrSvg || drawingRef.current) {
          reject(new Error("Missing offscreen canvas or QR SVG"));
          return;
        }

        drawingRef.current = true;
        const canvas = offscreenCanvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          drawingRef.current = false;
          reject(new Error("No offscreen canvas context"));
          return;
        }

        requestAnimationFrame(() => {
          // Clear offscreen canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Create gradient background
          const gradient = ctx.createLinearGradient(
            0,
            0,
            canvas.width,
            canvas.height
          );
          gradient.addColorStop(0, "#ffffff");
          gradient.addColorStop(1, "#f8fafc");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Load and draw QR SVG
          const svgBlob = new Blob([qrSvg], {
            type: "image/svg+xml;charset=utf-8",
          });
          const url = URL.createObjectURL(svgBlob);
          const img = new Image();

          img.onload = () => {
            // Draw QR with minimal padding and rounded background
            const padding = 20;
            const qrSize = canvas.width - padding * 2;

            // White rounded background with shadow for QR
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 8;

            ctx.beginPath();
            ctx.roundRect(padding, padding, qrSize, qrSize, 16);
            ctx.fill();

            // Reset shadow
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Draw QR code full size
            ctx.drawImage(img, padding, padding, qrSize, qrSize);
            URL.revokeObjectURL(url);

            drawingRef.current = false;
            resolve();
          };

          img.onerror = () => {
            console.error("Failed to load QR SVG for PiP");
            URL.revokeObjectURL(url);
            drawingRef.current = false;
            reject(new Error("QR load error"));
          };

          img.src = url;
        });
      });
    }, [qrSvg]);

    // Copy offscreen to main canvas
    const copyToMainCanvas = useCallback(() => {
      if (!canvasRef.current || !offscreenCanvasRef.current) return;

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(offscreenCanvasRef.current, 0, 0);
    }, []);

    const openPiP = useCallback(async () => {
      if (!document.pictureInPictureEnabled) {
        console.warn("Picture-in-Picture is not supported in this browser");
        return; // Optionally show a UI message to the user
      }

      if (!canvasRef.current || !videoRef.current || !qrSvg) {
        console.warn("PiP cannot open: missing canvas, video, or QR SVG");
        return;
      }

      try {
        // Stop any existing stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        isPiPActiveRef.current = true;
        setIsActive(true);

        // Draw to offscreen and await completion
        await drawToOffscreen();

        // Copy to main canvas
        copyToMainCanvas();

        // Create video stream from main canvas
        const stream = canvasRef.current.captureStream(30);
        streamRef.current = stream;

        const video = videoRef.current;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;

        await video.play();
        await video.requestPictureInPicture();

        onPiPStart?.();
        console.log("PiP opened successfully");
      } catch (error) {
        console.error("Failed to open PiP:", error);
        closePiP();
      }
    }, [qrSvg, onPiPStart, drawToOffscreen, copyToMainCanvas]);

    // Close PiP
    const closePiP = useCallback(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        if (document.pictureInPictureElement === videoRef.current) {
          document.exitPictureInPicture().catch(() => {});
        }
        videoRef.current.srcObject = null;
      }

      isPiPActiveRef.current = false;
      setIsActive(false);
      drawingRef.current = false;
      onPiPStop?.();
      console.log("PiP closed");
    }, [onPiPStop]);

    // Monitor PiP close events
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const onLeavePiP = () => {
        isPiPActiveRef.current = false;
        setIsActive(false);
        onPiPStop?.();
      };

      video.addEventListener("leavepictureinpicture", onLeavePiP);
      return () => {
        video.removeEventListener("leavepictureinpicture", onLeavePiP);
      };
    }, [onPiPStop]);

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
      openPiP,
      closePiP,
      get isActive() {
        return isPiPActiveRef.current;
      },
    }));

    // Redraw when QR SVG changes
    useEffect(() => {
      if (isPiPActiveRef.current && qrSvg) {
        console.log("QR SVG updated, redrawing canvas");
        drawToOffscreen().then(copyToMainCanvas).catch(console.error);
      }
    }, [qrSvg, drawToOffscreen, copyToMainCanvas]);

    return (
      <>
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          style={{ display: "none" }}
        />
        <video
          ref={videoRef}
          style={{ display: "none" }}
          muted
          playsInline
          autoPlay
        />
      </>
    );
  }
);

PiPProvider.displayName = "PiPProvider";
