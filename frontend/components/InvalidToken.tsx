import React from "react";
import { QrCode } from "lucide-react";

export const InvalidToken: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg flex flex-col items-center gap-4">
        <QrCode size={48} className="text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900">
          Холбоос буруу байна
        </h2>
        <p className="text-gray-600 text-center">
          Та ангийн холбоосыг дахин шалгана уу.
        </p>
      </div>
    </div>
  );
};
