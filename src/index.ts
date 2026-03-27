import app from "./app";
import { config } from "./config/env";
import connectDB from "./config/db";

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${config.port}`);
    });
  } catch (err: any) {
    console.error(`❌ Server failed to start: ${err.message}`);
    process.exit(1);
  }
};

startServer();