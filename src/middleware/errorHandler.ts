import {
  Request,
  Response,
  NextFunction
} from "express";

import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: "VALIDATION_ERROR",
      details: error.flatten()
    });
  }

  if (error instanceof AppError) {
    return res.status(
      error.statusCode
    ).json({
      success: false,
      error: error.errorCode,
      message: error.message
    });
  }

  console.error(error);
  return res.status(500).json({
    success: false,
    error: "INTERNAL_SERVER_ERROR"
  });
}