import mongoose, { Schema } from "mongoose";

const AttendanceSchema = new Schema(
  {
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    lectureName: {
      type: String,
      required: true,
    },
    lectureDate: {
      type: String,
      required: true,
    },
    attendingStudents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
        required: true,
      },
    ],
  },
  { timestamps: true }
);

export const AttendanceModel = mongoose.model("Attendance", AttendanceSchema);
