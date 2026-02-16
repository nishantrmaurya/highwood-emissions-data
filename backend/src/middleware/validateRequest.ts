import { NextFunction, Request, RequestHandler, Response } from "express";
import { z } from "zod";

export function validateBody(schema: z.ZodType): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return next({
        statusCode: 400,
        message: "Validation error",
        details: parsed.error.issues,
      });
    }

    req.body = parsed.data;
    next();
  };
}
