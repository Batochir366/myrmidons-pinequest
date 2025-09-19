"use client";

import type React from "react";
import { User, Camera, CheckCircle } from "lucide-react";

interface ProgressIndicatorProps {
  step: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  step,
}) => {
  const steps = [
    { id: 1, label: "Оюутны ID", icon: User },
    { id: 2, label: "Царай таних", icon: Camera },
    { id: 3, label: "Амжилттай", icon: CheckCircle },
  ];

  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          {steps.map((stepItem) => {
            const Icon = stepItem.icon;
            const isActive =
              step === stepItem.id || (step === 3 && stepItem.id === 3);
            const isCompleted =
              step > stepItem.id || (step === 3 && stepItem.id <= 3);

            return (
              <div key={stepItem.id} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    isActive || isCompleted
                      ? "bg-slate-700 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  <Icon size={20} />
                </div>
                <span
                  className={`text-sm font-medium ${
                    isActive || isCompleted ? "text-slate-700" : "text-gray-400"
                  }`}
                >
                  {stepItem.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-slate-700 h-2 rounded-full transition-all duration-500"
            style={{
              width: step === 1 ? "33%" : step === 2 ? "66%" : "100%",
            }}
          />
        </div>
      </div>
    </div>
  );
};
