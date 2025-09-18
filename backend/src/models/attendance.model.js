import mongoose, { Schema } from "mongoose";

const AttendanceSchema = new Schema({
  classroom: { type: Schema.Types.ObjectId, ref: "Classroom", required: true },
  attendingStudents: [{ type: Schema.Types.ObjectId, ref: "Student" }],
  endedAt: { type: Date, default: null },
}, { timestamps: true });

export const AttendanceModel = mongoose.model("Attendance", AttendanceSchema);
