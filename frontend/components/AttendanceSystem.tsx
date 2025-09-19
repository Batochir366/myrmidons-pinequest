"use client";

import type React from "react";
import { useState } from "react";
import { QRError } from "@/components/QRerror";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { StudentIdStep } from "@/components/StudentIdStep";
import { SuccessStep } from "@/components/SuccessStep";
import { useURLParams } from "@/utils/useURLParams";
import { FaceRecognitionStep } from "./FaceRecognition";

export const AttendanceSystem: React.FC = () => {
  const [studentId, setStudentId] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [message, setMessage] = useState("");
  const params = useURLParams();

  // Early returns to avoid conditional hook usage
  if (params.isInvalid) {
    return <QRError />;
  }

  if (!params.paramsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
        <p className="text-gray-600 ml-3">Түр хүлээнэ үү...</p>
      </div>
    );
  }

  if (!params.attendanceId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Алдаа</h2>
          <p className="text-gray-600">Ирцийн ID олдсонгүй.</p>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StudentIdStep
            studentId={studentId}
            setStudentId={setStudentId}
            onNext={() => setStep(2)}
          />
        );
      case 2:
        return (
          <FaceRecognitionStep
            studentId={studentId}
            attendanceId={params.attendanceId!}
            message={message}
            setMessage={setMessage}
            onSuccess={() => setStep(3)}
            context="attendance"
          />
        );
      case 3:
        return <SuccessStep studentId={studentId} message={message} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProgressIndicator step={step} />
      <div className="flex-1 flex items-center justify-center p-6">
        {renderStep()}
      </div>
    </div>
  );
};

export default AttendanceSystem;
