import mongoose, { Schema } from "mongoose";

// Node.js app-д Flask users collection-тэй холбогдох User model
const UserSchema = new Schema({
  studentName: {
    type: String,
    required: true,
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
  },
  embedding: {
    type: [Number],
    required: true,
  },
  Classrooms: [
    {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
    }
  ]
}, {
  timestamps: true
});

// Model name = "User" → populate ref-д ашиглана
// Collection name = "users" → Flask app-д үүсгэсэн collection-тай таарна
export const UserModel = mongoose.model("User", UserSchema, "users");
