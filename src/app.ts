import express, { Application } from "express";
import cors from "cors";
import corsOptions from "./config/corsOptions";
import applySecurityMiddleware from "./middlewares/securityMiddleware";
import errorMiddleware from "./middlewares/errorMiddleware";
import healthRouter from "./routes/health";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes";
import resumeAnalysisRoutes from "./routes/resumeanalysis.routes";

const app: Application = express();

// ── Security (must be applied before routes) ───────────────────────────────
applySecurityMiddleware(app);

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(cors(corsOptions));

// ── Body Parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" })); // cap payload size
app.use(cookieParser()); // parse cookies
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/api", healthRouter);
app.use("/api/auth", userRoutes);
app.use("/api/resume-analyses", resumeAnalysisRoutes);

// ── Error Handler (must be last) ───────────────────────────────────────────
app.use(errorMiddleware);

export default app;
