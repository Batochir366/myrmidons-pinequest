import mongoose, { Schema } from "mongoose";

export const ClassroomSchema = new Schema(
  {
    lectureName: {
      type: String,
      required: true,
      trim: true,
    },
    lectureDate: {
      type: String,
      required: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    ClassroomStudents: [
      {
        studentId: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        embedding: {
          type: [Number],
          required: true,
        },
      },
    ],
    attendanceHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attendance",
      },
    ],
    joinLink: { type: String },
    joinCode: { type: String, unique: true, required: true },
  },
  {
    timestamps: true,
  }
);

export const ClassroomModel = mongoose.model("Classroom", ClassroomSchema);
