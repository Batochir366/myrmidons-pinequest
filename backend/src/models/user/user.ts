import { Schema, model, models, Types, Document, Model } from "mongoose";

export interface User extends Document {
  _id: Types.ObjectId;
  email: string;
  name: string;
  age?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    age: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel: Model<User> =
  (models.User as Model<User>) || model<User>("User", UserSchema);
