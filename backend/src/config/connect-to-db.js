import { connect } from "mongoose";

export const connectToDB = async () => {
  try {
    await connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://gbataa366_db_user:sXM3AMhScmviCN7c@kidsaving.dtylnys.mongodb.net/PineQuest"
    );
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
};
