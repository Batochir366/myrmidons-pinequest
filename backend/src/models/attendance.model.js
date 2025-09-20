import mongoose, { Schema } from "mongoose";

const AttendanceSchema = new Schema(
  {
    classroom: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    attendingStudents: [
      {
        student: { type: Schema.Types.ObjectId, ref: "User", required: true },
        attendedAt: { type: Date, default: Date.now },
      },
    ],
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const AttendanceModel = mongoose.model("Attendance", AttendanceSchema);
