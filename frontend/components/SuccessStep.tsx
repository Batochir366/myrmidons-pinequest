"use client";

import type React from "react";
import { CheckCircle } from "lucide-react";

interface SuccessStepProps {
  studentId: string;
  message: string;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({
  studentId,
  message,
}) => {
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString("mn-MN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ирц амжилттай бүртгэгдлээ!
        </h2>
        <p className="text-gray-600">{message}</p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Оюутны ID:</span>
          <span className="font-medium text-gray-900">{studentId}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Цаг:</span>
          <span className="font-medium text-gray-900">{getCurrentTime()}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Огноо:</span>
          <span className="font-medium text-gray-900">{getCurrentDate()}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-600">Төлөв:</span>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Батлагдсан
          </span>
        </div>
      </div>
    </div>
  );
};
