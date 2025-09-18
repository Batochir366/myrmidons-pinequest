import mongoose, { Schema } from "mongoose";

export const ClassroomSchema = new Schema(
  {
    lectureName: {
      type: String,
      required: true,
      trim: true,
    },

    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    ClassroomStudents: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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

export const ClassroomModel = mongoose.model("Classroom", ClassroomSchema);
