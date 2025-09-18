"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

type Student = {
  id: string;
  name: string;
  time: string;
  studentCode: string;
  avatar?: string;
};

interface AttendanceListProps {
  students: Student[];
  running: boolean;
  onAddRandomStudent: () => void;
}

export default function AttendanceList({
  students,
  running,
  onAddRandomStudent,
}: AttendanceListProps) {
  return (
    <div className="h-full">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-green-600" />
              Ирсэн оюутнууд
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {students.length} хүн
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {students.length === 0 ? (
              <EmptyState />
            ) : (
              students.map((student, index) => (
                <StudentItem
                  key={`${student.id}_${index}`}
                  student={student}
                  highlight={index === 0}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
      <p>Одоохондоо хэн ч ирээгүй байна</p>
      <p className="text-xs mt-1">QR код скан хийхийг хүлээж байна...</p>
    </div>
  );
}

function StudentItem({
  student,
  highlight,
}: {
  student: Student;
  highlight: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
        highlight
          ? "bg-green-50 border-green-200 shadow-sm"
          : "bg-white hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <img
          src={student.avatar || `https://i.pravatar.cc/40?u=${student.name}`}
          alt={student.name}
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
        />
        <div>
          <p className="font-medium text-sm">{student.name}</p>
          <p className="text-xs text-gray-500">{student.studentCode}</p>
        </div>
      </div>

      <div className="flex flex-col items-end">
        <p className="text-sm text-gray-600">{student.time}</p>
        <span className="px-2 py-0.5 mt-1 text-xs rounded-full bg-green-100 text-green-700 border border-green-200">
          ✓ Ирсэн
        </span>
      </div>
    </div>
  );
}
