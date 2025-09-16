import mongoose, { Schema } from "mongoose";

const TeacherSchema = new Schema(
  {
    teacherName: {
      type: String,
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
