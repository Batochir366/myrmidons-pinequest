import mongoose, { Schema } from "mongoose";

const FaceImage = new Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
    },
    image:{
        type: String,
      required: true,
      unique: true,
    }
  },
  {
    timestamps: true,
  }
);

export const Facemodel = mongoose.model("Faceimage", FaceImage);
