"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "./ui/button";

interface Props {
  onSuccess?: () => void;
}

export const CreateClassroomForm = ({ onSuccess }: Props) => {
  const [lectureName, setLectureName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const teacherId = localStorage.getItem("teacherId");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lectureName) return alert("Ангийн нэр шаардлагатай");

    setIsLoading(true);
    try {
      const { data } = await axios.post(
        "https://myrmidons-pinequest-backend.vercel.app/teacher/create-classroom",
        { lectureName, teacherId },
        { headers: { "Content-Type": "application/json" } }
      );

      alert("Ангийг амжилттай үүсгэлээ! Холбоос: " + data.joinLink);
      setLectureName("");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.message || error.message || "Алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <input
        type="text"
        placeholder="Ангийн нэр"
        value={lectureName}
        onChange={(e) => setLectureName(e.target.value)}
        className="w-full px-4 py-2 border rounded"
        required
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Үүсгэж байна..." : "Үүсгэх"}
      </Button>
    </form>
  );
};
