"use client";
import { Camera } from "lucide-react";
import { useEffect, useState } from "react";

export default function FaceVerify() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev + 5 >= 100 ? 100 : prev + 5));
    }, 200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="w-80 p-6 bg-white rounded-xl shadow-md text-center border border-gray-200">
        <h2 className="text-lg font-medium mb-2 text-black">
          Face Recognition
        </h2>
        <p className="text-sm mb-4 text-black">
          Please look directly at the camera
        </p>

        <div className="flex items-center justify-center w-48 h-48 mx-auto rounded-full border-2 border-gray mb-4">
          <Camera color="gray" />
        </div>

        <div className="text-sm text-black mb-1 flex justify-between">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-2 bg-gray-800 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
