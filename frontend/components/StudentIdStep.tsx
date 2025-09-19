"use client";

import type React from "react";
import { ArrowRight } from "lucide-react";

interface StudentIdStepProps {
  studentId: string;
  setStudentId: (id: string) => void;
  onNext: () => void;
}

export const StudentIdStep: React.FC<StudentIdStepProps> = ({
  studentId,
  setStudentId,
  onNext,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId.trim()) {
      onNext();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Оюутны ID-г оруулна уу
        </h2>
        <p className="text-gray-600">
          Ирцээ баталгаажуулахын тулд оюутны ID-г оруулна уу
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Оюутны ID
          </label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="24LP0000"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={!studentId.trim()}
          className="w-full bg-slate-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          Царай таних руу үргэлжлүүлэх
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
};
