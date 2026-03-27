import express, { Application } from "express";
import corsOptions from "./config/corsOptions";
import cors from "cors";
// import healthRouter from "./routes/health";
// import { errorHandler } from "./middlewares/errorHandler";

const app: Application = express();
app.use(cors(corsOptions));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// app.use("/api", healthRouter);

// // Error handler (must be last)
// app.use(errorHandler);

export default app;
