"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Plus, Link, Undo } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { axiosInstance } from "@/lib/utils";
import { ClassRoomDetail } from "./ClassRoomDeatial";
import { toast, Toaster } from "sonner";

// ---------- Types ----------
interface Student {
  name: string;
  studentId: string;
  avatar?: string;
}

interface Classroom {
  _id: string;
  lectureName: string;
  lectureDate: string;
  teacher: string;
  joinLink: string;
  joinCode: string;
  ClassroomStudents: Student[];
}

// ---------- Form ----------
const classroomSchema = z.object({
  name: z.string().min(2, "Нэр хамгийн багадаа 2 тэмдэгт байх ёстой"),
  startTime: z.string().nonempty("Эхлэх цаг шаардлагатай"),
  endTime: z.string().nonempty("Дуусах цаг шаардлагатай"),
});

type ClassroomForm = z.infer<typeof classroomSchema>;

export const ClassroomsView = () => {
  const [data, setData] = useState<Classroom[]>([]);
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClassroom, setShowClassroom] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Student[] | null>(
    null
  );
  const [selectedJoinCode, setSelectedJoinCode] = useState<string | undefined>(undefined);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [teacherId, setTeacherId] = useState("");
  useEffect(() => {
    const storedId = localStorage.getItem("teacherId");
    if (storedId) {
      setTeacherId(storedId);
    }
    fetchClassrooms();
  }, [teacherId]);
  // ---------- Fetch classrooms ----------
  const fetchClassrooms = async () => {
    if (!teacherId) return;
    try {
      const res = await axiosInstance.get(
        `teacher/classrooms-and-students/${teacherId}`
      );
      setData(res.data.classrooms);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
    }
  };
  // ---------- Create classroom ----------
  const createClassroom = async (values: ClassroomForm) => {
    const formattedStartTime = values.startTime + " - " + values.endTime;

    try {
      setLoading(true);
      await axiosInstance.post("teacher/create-classroom", {
        lectureName: values.name,
        lectureDate: formattedStartTime,
        teacherId: teacherId,
      });

      toast.success("Анги амжилттай үүсгэлээ!");
      fetchClassrooms();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "❌ Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (values: ClassroomForm) => {
    createClassroom(values);
  };

  // ---------- Copy link ----------
  const handleCopy = async (link: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = link;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedId(link);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // ---------- Form hook ----------
  const form = useForm<ClassroomForm>({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      name: "",
      startTime: "",
      endTime: "",
    },
  });

  console.log("selectedJoinCode", selectedJoinCode);
  // ---------- Render ----------
  return (
    <div className="space-y-6 w-full">
      <Toaster position="bottom-right" />
      {/* Create Classroom Button */}
      {showClassroom === false && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white font-semibold rounded-md shadow hover:scale-105 transition-all duration-200">
                Анги үүсгэх
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Шинэ анги үүсгэх</DialogTitle>
                <DialogDescription>
                  Сурагчид болон хичээлээ зохион байгуулахын тулд шинэ анги
                  нэмнэ үү.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4 py-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Нэр</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="жишээ нь: Дээд математик"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4 items-start">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Эхлэх цаг</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Дуусах цаг</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full px-4 py-2 bg-slate-700 text-white font-semibold rounded-md shadow hover:scale-105 transition-all duration-200 disabled:opacity-60"
                    >
                      {loading ? "Үүсгэж байна..." : "Үүсгэх"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Back Button */}
      {showClassroom && (
        <Button
          onClick={() => setShowClassroom(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors duration-200 shadow-sm"
        >
          <Undo className="w-4 h-4" /> Буцах
        </Button>
      )}

      {/* Classrooms Grid */}
      <div className="flex flex-wrap gap-6 mt-4">
        {!showClassroom &&
          data.map((classroom) => (
            <Card
              key={classroom._id}
              className="flex-1 min-w-[250px] max-w-[300px] w-full "
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {classroom.lectureName}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {classroom.lectureDate}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm mb-4">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {classroom.ClassroomStudents?.length}
                  </span>
                  <span className="text-muted-foreground">сурагч</span>
                </div>
                <div className="flex gap-2 flex-col h-fit">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs underline cursor-pointer py-1"
                    onClick={() => handleCopy(classroom.joinLink)}
                  >
                    {copiedId === classroom.joinLink
                      ? "Амжилттай хууллаа!"
                      : "Xолбоос хуулах"}
                    <Link className="h-4 w-4 text-muted-foreground ml-1" />
                  </Button>
                  <Button
                    disabled={classroom.ClassroomStudents.length === 0}
                    size="sm"
                    variant="secondary"
                    className="flex-1 text-xs py-1"
                    onClick={() => {
                      setSelectedClassroom(classroom.ClassroomStudents);
                      setShowClassroom(true);
                      setSelectedJoinCode(classroom.joinCode);
                      setSelectedClassroomId(classroom._id);
                    }}
                  >
                    {classroom.ClassroomStudents.length === 0
                      ? "Оюутан байхгүй"
                      : "Ангийн дэлгэрэнгүй"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

        {/* ClassRoomDetail */}
        {showClassroom && <ClassRoomDetail classroom={selectedClassroom} joinCode={selectedJoinCode} classroomId={selectedClassroomId} />}
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Одоогоор анги байхгүй байна
            </h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Сурагчдаа зохион байгуулахын тулд эхний ангиа үүсгэж эхлээрэй.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
