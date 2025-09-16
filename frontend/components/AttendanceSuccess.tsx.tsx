"use client";
import { CircleCheckBig } from "lucide-react";
import { useState, useEffect } from "react";

type AttendanceSuccessProps = {
  studentId: string;
  status?: "Present";
};

export default function AttendanceSuccess({
  studentId,
  status = "Present",
}: AttendanceSuccessProps) {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const now = new Date();
    setTime(now.toLocaleTimeString());
    setDate(now.toLocaleDateString());
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-80 p-6 bg-white rounded-xl shadow-md text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <CircleCheckBig className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Attendance Recorded!
        </h2>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left text-gray-800">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Student ID:</span>
            <span className="font-mono">{studentId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Time:</span>
            <span>{time}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Date:</span>
            <span>{date}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Status:</span>
            <span className="px-2 py-1 rounded-full bg-green-100 text-xs font-medium">
              {status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
