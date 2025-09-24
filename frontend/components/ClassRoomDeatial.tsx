import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Student {
  name: string;
  studentId: string;
  avatar?: string;
}

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
  onDelete,
}) => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const filteredStudents = classroom?.filter(
    (student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.studentId.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteClick = () => {
    if (!classroomId) {
      toast.error("Ангийн ID олдсонгүй");
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleDelete = async () => {
    if (!classroomId) {
      toast.error("Ангийн ID олдсонгүй");
      setShowConfirmDialog(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.delete(
        `/teacher/delete-classroom/${classroomId}`
      );

      if (response.status === 200 || response.status === 204) {
        toast.success("Ангийг амжилттай устгалаа");

        const stored = localStorage.getItem("selected_classroom");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.classroomId === classroomId) {
            localStorage.removeItem("selected_classroom");
          }
        }

        if (onDelete) onDelete();
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (err: any) {
      console.error("Delete classroom error:", err);

      if (err.response) {
        const errorMessage =
          err.response.data?.message ||
          err.response.data?.error ||
          "Анги устгахад алдаа гарлаа";
        toast.error(`Алдаа: ${errorMessage}`);
      } else if (err.request) {
        toast.error("Сервертэй холбогдож чадсангүй");
      } else {
        toast.error("Анги устгахад алдаа гарлаа");
      }
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between flex-wrap">
          <h3 className="text-lg font-semibold">Оюутнуудын жагсаалт</h3>
          <div className="flex flex-col items-end gap-1 text-lg text-gray-500 font-medium w-[150px]">
            <span>{classroom?.length ?? 0} оюутан</span>
            {joinCode && (
              <span className="text-sm text-gray-400">
                Ангийн код: {joinCode}
              </span>
            )}
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={loading}
              className="w-full"
            >
              Ангийг устгах
            </Button>

            {/* SHADCN Dialog */}
            <Dialog
              open={showConfirmDialog}
              onOpenChange={setShowConfirmDialog}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Анхааруулга</DialogTitle>
                  <DialogDescription>
                    Та энэ ангийг устгахдаа итгэлтэй байна уу?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmDialog(false)}
                    disabled={loading}
                  >
                    Цуцлах
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    {loading ? "Устгаж байна..." : "Устгах"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                  <AvatarFallback className="text-sm uppercase">
                    {student.name?.slice(0, 2) || "??"}
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
