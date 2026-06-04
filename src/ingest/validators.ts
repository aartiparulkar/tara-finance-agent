import { z } from "zod";

export const transactionSchema = z.object({
  id: z.string(),
  date: z.string(),
  amount: z.number(),
  category: z.string(),
  currency: z.string(),
  merchant: z.string(),
});