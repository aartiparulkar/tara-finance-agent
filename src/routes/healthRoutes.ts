import { Router } from "express";

const router = Router();

router.get("/", async (_req, res) => {
  return res.status(200).json({
    success: true,
    uptime: process.uptime(),
    timestamp:
      new Date().toISOString()
  });
});

export default router;