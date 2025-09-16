"use client";
import { useState } from "react";

export default function StudentIdInput() {
  const [studentId, setStudentId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Entered Student ID:", studentId);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <form
        onSubmit={handleSubmit}
        className="w-80 max-w-sm p-6 bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <h2 className="text-xl font-semibold text-center mb-2 text-black">
          Enter Student ID
        </h2>
        <p className="text-sm text-center mb-6 text-black">
          Please provide your student identification number
        </p>

        <label className="block text-sm font-medium mb-2 text-black">
          Student ID
        </label>
        <input
          type="text"
          placeholder="24LP0000"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-400"
          required
        />

        <button
          type="submit"
          className="mt-6 w-full py-2 px-4 bg-black text-white rounded-lg shadow hover:bg-white hover:text-black border border-black transition"
        >
          Continue to Face Recognition →
        </button>
      </form>
    </div>
  );
}
