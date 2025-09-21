import { configDotenv } from "dotenv";
import mongoose from "mongoose";

configDotenv();

export const connectToDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI ||
      "mongodb+srv://tinderpinecone:FFpZdNZp1ifDSumn@tindermongodb.ukfwlma.mongodb.net/face_verification_db";

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
    });

    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
};
