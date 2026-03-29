import dotenv from "dotenv";
dotenv.config();

const requiredEnvVars = [
  "MONGODB_URI",
  "CLIENT_URLS",
  "JWT_SECRET",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const clientUrls = process.env.CLIENT_URLS!.split(",").map((url) => url.trim());

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  mongodb_uri: process.env.MONGODB_URI as string,

  jwt_secret: process.env.JWT_SECRET as string,

  gemini_api_key: process.env.GEMINI_API_KEY as string,

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID as string,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"), // 🔥 important fix
  },

  allowed_urls: [
    "http://localhost:3000",
    "http://localhost:5173",
    ...clientUrls,
  ],
};



