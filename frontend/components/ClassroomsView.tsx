"use client";

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

import { useState } from "react";

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
import { ClassRoomDetail } from "./ClassRoomDeatial";
import { se } from "date-fns/locale";
interface Classroom {
  id: string;
  name: string;
  subject: string;
  studentCount: number;
}

const mockClassrooms: Classroom[] = [
  {
    id: "1",
    name: "Дээд математик",
    subject: "12:00 - 13:00 ",
    studentCount: 28,
  },
  {
    id: "2",
    name: "Физикийн лаборатори",
    subject: "12:00 - 13:00",
    studentCount: 24,
  },
  { id: "3", name: "Дэлхийн түүх", subject: "12:00 - 13:00", studentCount: 32 },
  {
    id: "4",
    name: "Бүтээлч бичлэг",
    subject: "12:00 - 13:00",
    studentCount: 20,
  },
  {
    id: "5",
    name: "Биологийн үндэс",
    subject: "12:00 - 13:00",
    studentCount: 26,
  },
  {
    id: "6",
    name: "Компьютерийн шинжлэх ухаан 101",
    subject: "12:00 - 13:00",
    studentCount: 15,
  },
];

const classroomSchema = z.object({
  name: z.string().min(2, "Нэр хамгийн багадаа 2 тэмдэгт байх ёстой"),
  startTime: z.string().nonempty("Эхлэх цаг шаардлагатай"),
  endTime: z.string().nonempty("Дуусах цаг шаардлагатай"),
});

type ClassroomForm = z.infer<typeof classroomSchema>;

export const ClassroomsView = () => {
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClassroom, setShowClassroom] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(
    null
  );
  const handleCopy = async (classroomId: string) => {
    const joinLink = ` https://youtube.com/${classroomId}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(joinLink);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = joinLink;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopiedId(classroomId);
      setTimeout(() => setCopiedId(null), 2000); // 2s дараа reset
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };
  const form = useForm<ClassroomForm>({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      name: "",
      startTime: "",
      endTime: "",
    },
  });

  const onSubmit = (values: ClassroomForm) => {
    const formattedStartTime = values.startTime + " - " + values.endTime;
    values.startTime = formattedStartTime;
    console.log("✅ Creating classroom:", values);
    setOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
      {!showClassroom ? (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                type="submit"
                className="w-fit px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-900 text-white font-semibold rounded-md shadow hover:scale-105 transition-all duration-200"
              >
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
                  className="space-y-4 py-4 "
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

                  <div className="grid grid-cols-2 gap-4 flex items-start">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Эхлэх цаг</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage className="text-center" />{" "}
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
                          <FormMessage className="text-center" />{" "}
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="submit"
                      className="w-full px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-900 text-white font-semibold rounded-md shadow hover:scale-105 transition-all duration-200"
                    >
                      Үүсгэх
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <Button
          onClick={() => setShowClassroom(false)}
          type="button"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors duration-200 shadow-sm"
        >
          <Undo className="w-4 h-4" />
          Буцах
        </Button>
      )}

      {selectedClassroom && showClassroom ? (
        <ClassRoomDetail />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockClassrooms.map((classroom) => (
            <Card key={classroom.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {classroom.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {classroom.subject}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm mb-4">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{classroom.studentCount}</span>
                  <span className="text-muted-foreground">сурагч</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setSelectedClassroom(classroom);
                      setShowClassroom(true);
                    }}
                  >
                    Ангийн дэлгэрэнгүй
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs underline cursor-pointer"
                    onClick={() => handleCopy(classroom.id)}
                  >
                    {copiedId === classroom.id
                      ? "Амжилттай хууллаа!"
                      : "Xолбоос хуулах"}
                    <Link className="h-4 w-4 text-muted-foreground ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {mockClassrooms.length === 0 && (
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
