import mongoose, { Schema } from "mongoose";

const TeacherSchema = new Schema({
  teacherName: { type: String, required: true },
  embedding: { type: [Number], required: true }, 
  Classrooms: [{ type: Schema.Types.ObjectId, ref: "Classroom" }],
}, { timestamps: true });

export const TeacherModel = mongoose.model("Teacher", TeacherSchema);
