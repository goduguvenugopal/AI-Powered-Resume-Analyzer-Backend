import mongoose from "mongoose";
import { config } from "./env";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb_uri);
    console.log(`✅ MongoDB Connected Successfully`);
  } catch (err: any) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
