import express, { Application } from "express";
import cors from "cors";
import corsOptions from "./config/corsOptions";
import applySecurityMiddleware from "./middlewares/securityMiddleware";
import errorMiddleware from "./middlewares/errorMiddleware";
import healthRouter from "./routes/health";
import cookieParser from "cookie-parser";

const app: Application = express();

// ── Security (must be applied before routes) ───────────────────────────────
applySecurityMiddleware(app);

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(cors(corsOptions));

// ── Body Parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));        // cap payload size
app.use(cookieParser()); // parse cookies
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/api", healthRouter);

// ── Error Handler (must be last) ───────────────────────────────────────────
app.use(errorMiddleware);

export default app;