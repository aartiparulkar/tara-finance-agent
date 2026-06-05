import { Pool } from "pg";
import dotenv from "dotenv";
import { env } from "../config/env.js";

dotenv.config();

export const pool = new Pool({
  connectionString: env.DATABASE_URL
});