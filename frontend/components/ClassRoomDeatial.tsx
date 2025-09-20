"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";

const lecture = {
  students: [
    { name: "Бат-Эрдэнэ", studentId: "S001" },
    { name: "Оюунтуяа", studentId: "S002" },
    { name: "Сүхбат", studentId: "S003" },
    { name: "Мөнх-Эрдэнэ", studentId: "S004" },
    { name: "Энхжаргал", studentId: "S005" },
    { name: "Бат-Эрдэнэ", studentId: "S001" },
    { name: "Оюунтуяа", studentId: "S002" },
    { name: "Сүхбат", studentId: "S003" },
    { name: "Мөнх-Эрдэнэ", studentId: "S004" },
    { name: "Энхжаргал", studentId: "S005" },
  ],
};

export const ClassRoomDetail = () => {
  const [search, setSearch] = useState("");

  const filteredStudents = lecture.students.filter(
    (student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.studentId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardContent className="space-y-4">
        {/* Header */}
        <h3 className="text-lg font-semibold flex items-center justify-between text-no-wrap">
          Оюутнуудын жагсаалт
          <span className="flex items-center gap-2 text-lg text-gray-500 font-medium w-[120px]">
            {/* Online indicator */}
            <span className=" w-3 h-3 bg-green-500 rounded-full" />
            {lecture.students.length} оюутан
          </span>
        </h3>
        {/* Search Field */}
        <input
          type="text"
          placeholder="Оюутны нэр эсвэл ID хайх..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[293px] px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
        />
        {/* Students Grid */}
        <div className="grid grid-cols-2 xl:grid-cols-8 gap-4 mt-2">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-gray-100 transition-colors"
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
            <div className="col-span-full text-center text-gray-500 py-6">
              Оюутан олдсонгүй
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
