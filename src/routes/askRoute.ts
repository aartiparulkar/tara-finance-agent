import { Router } from "express";
import { z } from "zod";

import { askTara } from "../agent/orchestration.js";

const askSchema = z.object({question: z.string().min(1)});
const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const validated = askSchema.parse(req.body);
    const response = await askTara(validated.question);
    console.log("Agent response:", response);
    return res.status(200).json({
      success: true,
      response
    });

  } catch (error) {
    next(error);
  }
});

export default router;