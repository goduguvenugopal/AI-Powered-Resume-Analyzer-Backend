import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = ["MONGODB_URI", "CLIENT_URLS"] as const;

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const clientUrls = process.env.CLIENT_URLS!
  .split(",")                
  .map((url) => url.trim()); 

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodb_uri: process.env.MONGODB_URI as string,
  allowed_urls: [
    "http://localhost:3000",
    "http://localhost:5173",
    ...clientUrls,             
  ],
};