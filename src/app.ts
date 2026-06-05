import express from "express";
import dotenv from "dotenv";
import { env } from "./config/env.js";

import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import askRoute from "./routes/askRoute.js";
import healthRoute from "./routes/healthRoutes.js";
import { pool } from "./db/connection.js";

import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

app.use(express.json());

app.use(requestLogger);
app.use(errorHandler);
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use("/ask", askRoute);
app.use("/health", healthRoute);

const PORT = env.PORT || 3000;

async function startServer() {
  try {
    await pool.query("SELECT 1");

    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {

  console.log(
    "Shutting down gracefully..."
  );

  await pool.end();

  process.exit(0);
});

startServer();
