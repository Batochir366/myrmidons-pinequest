"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import { Toaster, toast } from "sonner";
import { Check } from "lucide-react";

interface Props {
  onSuccess?: () => void;
}

export const CreateClassroomForm = ({ onSuccess }: Props) => {
  const [lectureName, setLectureName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const teacherId = localStorage.getItem("teacherId");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lectureName) {
      toast.error("Ангийн нэр шаардлагатай");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(
        "https://myrmidons-pinequest-backend.vercel.app/teacher/create-classroom",
        { lectureName, teacherId },
        { headers: { "Content-Type": "application/json" } }
      );

      toast.custom(() => (
        <div className="w-[400px] p-4 rounded-xl shadow-lg bg-[#18181b] text-white flex items-center gap-4 transition-all">
          <Check className="size-4 text-white" />
          <span className="text-[16px] font-medium text-[#FAFAFA]">
            Ангийг амжилттай үүсгэлээ!{" "}
            <a
              href={res.data.joinLink}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-400"
            >
              Холбоосыг энд дарна уу
            </a>
          </span>
        </div>
      ));

      setLectureName("");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.message || "Алдаа гарлаа"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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
    </>
  );
};
