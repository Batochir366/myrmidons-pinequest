"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { CreateClassroomForm } from "./CreateClassroom";
import { Toaster } from "sonner";

interface Classroom {
  _id: string;
  lectureName: string;
  joinLink: string;
}

export const ClassroomsView = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const teacherId = localStorage.getItem("teacherId");

  const fetchClassrooms = async () => {
    if (!teacherId) return;

    setLoading(true);
    try {
      const res = await axios.get(
        `https://myrmidons-pinequest-backend.vercel.app/teacher/${teacherId}/classes`
      );
      setClassrooms(res.data.classrooms);
    } catch (error) {
      alert("Ангийн жагсаалт авахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleClassroomCreated = () => {
    setIsDialogOpen(false);
    fetchClassrooms();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Ангийн жагсаалт</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Анги үүсгэх</Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-[340px] sm:max-w-[340px]">
            <DialogHeader>
              <DialogTitle className="w-full flex justify-center">
                Шинэ анги үүсгэх
              </DialogTitle>
            </DialogHeader>
            <CreateClassroomForm onSuccess={handleClassroomCreated} />
            <DialogClose asChild>
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label="Close"
              ></button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p>Түр хүлээнэ үү...</p>
      ) : classrooms.length === 0 ? (
        <div className="text-center py-10">
          <p className="mb-4 text-gray-600">Ангийн мэдээлэл олдсонгүй.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classrooms.map((classroom) => (
            <div
              key={classroom._id}
              className="p-4 border rounded-md flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{classroom.lectureName}</p>
                <a
                  href={classroom.joinLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Орох холбоос
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
      <Toaster position="bottom-right" />
    </div>
  );
};
