import { Request, Response, NextFunction } from "express";

import { randomUUID } from "crypto";

export function requestLogger(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const requestId = randomUUID();
  req.headers["x-request-id"] = requestId;

  console.log(
    JSON.stringify({
      level: "info",
      requestId,
      method: req.method,
      path: req.path,
      timestamp:
        new Date().toISOString()
    })
  );

  next();
}