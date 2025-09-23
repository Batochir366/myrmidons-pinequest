"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { z } from "zod";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { axiosInstance } from "@/lib/utils";
import { toast } from "sonner";

// ---------- Types ----------
interface Student {
  name: string;
  studentId: string;
  avatar?: string;
}

// ---------- Form ----------
const classroomSchema = z.object({
  name: z.string().min(2, "Нэр хамгийн багадаа 2 тэмдэгт байх ёстой"),
  startTime: z.string().nonempty("Эхлэх цаг шаардлагатай"),
  endTime: z.string().nonempty("Дуусах цаг шаардлагатай"),
});

type ClassroomForm = z.infer<typeof classroomSchema>;

// ---------- ClassRoomDetail ----------
interface ClassRoomDetailProps {
  classroom: Student[] | null;
  joinCode?: string;
  classroomId?: string;
  onDelete?: () => void;
}

export const ClassRoomDetail: React.FC<ClassRoomDetailProps> = ({
  classroom,
  joinCode,
  classroomId,
  onDelete
}) => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredStudents = classroom?.filter(
    (student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.studentId.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!classroomId) {
      toast.error("Ангийн ID олдсонгүй");
      return;
    }

    const confirmDelete = window.confirm("Та энэ ангийг устгахдаа итгэлтэй байна уу?");
    if (!confirmDelete) return;

    try {
      setLoading(true);

      // Make the delete request
      const response = await axiosInstance.delete(`/teacher/delete-classroom/${classroomId}`);

      // Check if the request was successful
      if (response.status === 200 || response.status === 204) {
        // Call the onDelete callback to refresh the parent component
        // The parent will handle the success toast and navigation
        if (onDelete) {
          onDelete();
        }
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }

    } catch (err: any) {
      console.error("Delete classroom error:", err);

      // More detailed error handling
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorMessage = err.response.data?.message || err.response.data?.error || "Анги устгахад алдаа гарлаа";
        toast.error(`Алдаа: ${errorMessage}`);
        console.error("Response error:", err.response.data);
      } else if (err.request) {
        // The request was made but no response was received
        toast.error("Сервертэй холбогдож чадсангүй");
        console.error("Request error:", err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        toast.error("Анги устгахад алдаа гарлаа");
        console.error("Error:", err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  console.log("joincode 2", joinCode);
  console.log("classroomId:", classroomId); // Debug log

  return (
    <Card className="w-full">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between flex-wrap">
          <h3 className="text-lg font-semibold">
            Оюутнуудын жагсаалт
          </h3>
          <div className="flex flex-col items-end gap-1 text-lg text-gray-500 font-medium w-[150px]">
            <span>{classroom?.length ?? 0} оюутан</span>
            {joinCode && <span className="text-sm text-gray-400">Ангийн код: {joinCode}</span>}
            <button
              onClick={handleDelete}
              disabled={loading || !classroomId}
              className="mt-2 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Устгаж байна..." : "Анги устгах"}
            </button>
          </div>
        </div>

        {/* Search Field */}
        <input
          type="text"
          placeholder="Оюутны нэр эсвэл ID хайх..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-[293px] px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
        />

        {/* Students Grid */}
        <div className="flex flex-wrap gap-4 mt-2">
          {filteredStudents && filteredStudents.length > 0 ? (
            filteredStudents.map((student, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-gray-100 transition-colors flex-1 min-w-[120px] max-w-[200px]"
              >
                <Avatar className="w-12 h-12 mb-2">
                  <AvatarFallback className="text-sm">
                    {student.name?.[0]}
                    {student.name?.[1]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium truncate max-w-full text-center">
                  {student.name}
                </span>
                <span className="text-gray-500 text-sm truncate max-w-full text-center">
                  {student.studentId}
                </span>
              </div>
            ))
          ) : (
            <div className="w-full text-center text-gray-500 py-6">
              Оюутан олдсонгүй
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};