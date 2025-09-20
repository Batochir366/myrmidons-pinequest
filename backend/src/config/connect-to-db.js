import { configDotenv } from "dotenv";
import { connect } from "mongoose";

configDotenv();

export const connectToDB = async () => {
  try {
    await connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/face_verification_db",
      {
        // Connection timeout settings
        serverSelectionTimeoutMS: 30000, // 30 seconds instead of default 10s
        socketTimeoutMS: 45000, // 45 seconds for socket operations
        connectTimeoutMS: 30000, // 30 seconds to establish connection

        // Connection pool settings
        maxPoolSize: 10, // Maximum connections in pool
        minPoolSize: 2, // Minimum connections to maintain
        maxIdleTimeMS: 30000, // Close connections after 30s idle

        // Other settings
        bufferMaxEntries: 0, // Disable mongoose buffering
        retryWrites: true, // Enable retryable writes
        w: "majority", // Write concern
      }
    );
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error; // Re-throw to handle in calling code
  }
};
