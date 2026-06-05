import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string(),
  DATABASE_URL: z.string(),
  OPENAI_API_KEY: z.string(),
  MODEL_NAME: z.string()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten().fieldErrors
  );

  process.exit(1);
}

export const env = parsed.data;