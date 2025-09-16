import mongoose, { Schema } from "mongoose";

const studentSchema = new Schema(
  {
    studentName: { type: String, required: true },
    studentId: { type: String, required: true, unique: true },
    embedding: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const StudentModel = mongoose.model("Student", studentSchema);
