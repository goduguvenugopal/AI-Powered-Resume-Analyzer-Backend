import express, { Application } from "express";
// import healthRouter from "./routes/health";
// import { errorHandler } from "./middlewares/errorHandler";

const app: Application = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// app.use("/api", healthRouter);

// // Error handler (must be last)
// app.use(errorHandler);

export default app;