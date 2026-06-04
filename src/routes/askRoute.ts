import { Router } from "express";

const router = Router();

router.post("/", async (_req, res) => {
  return res.status(200).json({
    success: true,
    message: "Tara Finance Research Agent API is running."
  });
});

export default router;