import { configDotenv } from "dotenv";
import { connect } from "mongoose";
configDotenv();
export const connectToDB = async () => {
  try {
    await connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/face_verification_db"
    );
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
};
