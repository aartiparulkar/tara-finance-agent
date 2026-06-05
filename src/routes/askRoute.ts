import { Router } from "express";
import { z } from "zod";

import { askTara } from "../agent/orchestration";

const askSchema = z.object({question: z.string().min(1)});
const router = Router();

router.post("/", async (req, res) => {
  try {
    const validated = askSchema.parse(req.body);
    const response = await askTara(validated.question);
    console.log("Agent response:", response);
    return res.status(200).json({
      success: true,
      response
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;