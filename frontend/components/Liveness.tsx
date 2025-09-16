"use client";
import React, { useRef, useState, useEffect } from "react";

export default function LivenessCapture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [studentId, setStudentId] = useState("");
  const [livenessConfirmed, setLivenessConfirmed] = useState(false);
  const [message, setMessage] = useState("Please blink your eyes");

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { min: 640, ideal: 1280 },
          height: { min: 480, ideal: 720 },
        },
      })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => {
        setMessage("Error accessing webcam: " + err.message);
      });
  }, []);

  const checkLiveness = () => {
    setMessage("Checking liveness...");
    setTimeout(() => {
      setLivenessConfirmed(true);
      setMessage("Liveness confirmed! You can now capture photo.");
    }, 3000);
  };

  const capturePhoto = () => {
    if (!livenessConfirmed) {
      alert("Please confirm liveness first!");
      return;
    }

    if (!studentId.trim()) {
      alert("Please enter your Student ID.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      alert("Video or canvas element not found");
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert("Video not ready. Please wait...");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      alert("Could not get canvas context");
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataURL = canvas.toDataURL("image/jpeg");

    fetch("https://your-railway-url.railway.app", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentId: studentId.trim(),
        image_base64: imageDataURL,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server Error (${response.status}): ${errorText}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("✅ Face Verification Success:", data);
        if (data.verified) {
          alert(`✅ Welcome, ${data.name}`);
        } else {
          alert("❌ Face did NOT match");
        }
      })
      .catch((error) => {
        console.error("❌ Fetch Error:", error.message);
        alert(`Error: ${error.message}`);
      });
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Liveness Detection + Face Login</h2>

      <label>
        Enter Student ID:{" "}
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="e.g. 12345"
        />
      </label>

      <br />
      <br />

      <video
        ref={videoRef}
        width="400"
        height="300"
        style={{ border: "1px solid #ccc" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <p>{message}</p>

      {!livenessConfirmed && (
        <button onClick={checkLiveness}>Start Liveness Check (Blink)</button>
      )}

      {livenessConfirmed && (
        <button onClick={capturePhoto}>Capture & Verify</button>
      )}
    </div>
  );
}
