import express from "express";
import dotenv from "dotenv";

import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import askRoute from "./routes/askRoute";
import { pool } from "./db/connection";

dotenv.config();

const app = express();

app.use(express.json());

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use("/ask", askRoute);

const PORT = process.env.PORT || 3000;

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

startServer();
