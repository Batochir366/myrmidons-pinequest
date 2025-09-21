"use client";
import { PYTHON_BACKEND_URL } from "@/lib/utils";
import React, { useState, useRef } from "react";
import Webcam from "react-webcam";

export default function Signup() {
  const webcamRef = useRef<Webcam>(null);
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const capture = () => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot();
      if (screenshot) {
        setImageBase64(screenshot);
        setMessage("Image captured!");
      }
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !studentId.trim() || !imageBase64) {
      alert("Please provide name, student ID, and capture a face image.");
      return;
    }

    const payload = {
      name,
      studentId,
      image_base64: imageBase64,
    };

    try {
      const response = await fetch(`${PYTHON_BACKEND_URL}register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      alert(data.message || "Signup successful!");
      setName("");
      setStudentId("");
      setImageBase64(null);
      setMessage("");
    } catch (error: any) {
      alert("Signup failed: " + (error.message || error.toString()));
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", textAlign: "center" }}>
      <h2>Face Sign Up</h2>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />
      <input
        placeholder="Student ID"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={320}
        height={240}
        videoConstraints={{ facingMode: "user" }}
      />
      <button onClick={capture} style={{ margin: "10px 0" }}>
        Capture Face Image
      </button>
      {message && <p>{message}</p>}
      <button
        onClick={handleSubmit}
        disabled={!imageBase64 || !name || !studentId}
      >
        Submit
      </button>
    </div>
  );
}
