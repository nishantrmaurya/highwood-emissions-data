import { Request, Response, NextFunction } from "express";

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
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const response: ErrorResponse = {
    status: "error",
    message: err.message || "Internal Server Error",
    details: err.details || undefined,
  };
  res.status(statusCode).json(response);
}

// Usage: app.use(errorHandler);