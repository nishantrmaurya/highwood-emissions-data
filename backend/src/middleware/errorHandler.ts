import { Request, Response, NextFunction } from "express";
import { prismaClient } from "../config/prisma/prismaClient.js";
import { error_severity } from "../config/prisma/generated/browser.js";

// Standard error response structure
interface ErrorResponse {
  status: "error";
  message: string;
  details?: any;
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const statusCode = err.statusCode || 500;
  const response: ErrorResponse = {
    status: "error",
    message: err.message || "Internal Server Error",
    details: err.details || undefined,
  };

  logError(err, req, statusCode).finally(() => {
    res.status(statusCode).json(response);
  });
}

async function logError(err: any, req: Request, statusCode: number) {
  // Log error to database
  try {
    await prismaClient.error_log.create({
      data: {
        service: err.service || "backend",
        endpoint: req.originalUrl,
        request_id: req.headers["x-request-id"] as string | undefined,
        error_code: err.error_code || String(statusCode),
        message: err.message || "Internal Server Error",
        severity: err.severity || error_severity.medium,
        context: {
          body: req.body,
          params: req.params,
          query: req.query,
          stack: err.stack,
          details: err.details,
        },
        site_id: err.site_id || undefined,
      },
    });
  } catch (dbErr) {
    console.error("Failed to log error to DB:", dbErr);
  }
}
