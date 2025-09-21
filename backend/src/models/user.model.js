import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
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
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.model("User", UserSchema, "users");
