import { Request, Response, NextFunction } from "express";
import { createSiteSchema } from "../models/site.schema.js";
import { SiteService } from "../services/siteService.js";

export async function createSite(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createSiteSchema.safeParse(req.body);
    if (!parsed.success) {
      return next({
        statusCode: 400,
        message: "Validation error",
        details: parsed.error.issues,
      });
    }
    const site = await SiteService.createSite(parsed.data);
    res.status(201).json({ status: "success", data: site });
  } catch (err) {
    next(err);
  }
}
