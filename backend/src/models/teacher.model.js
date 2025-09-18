import mongoose, { Schema } from "mongoose";
import { type } from "os";

const TeacherSchema = new Schema(
  {
    teacherName: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number], // array of numbers
      required: true,
    },
    attendanceHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attendance",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const TeacherModel = mongoose.model("Teacher", TeacherSchema);
