import { Request, Response, NextFunction } from "express";
import { createSiteSchema } from "../models/site.schema.js";
import { SiteService } from "../services/siteService.js";

// Get site metrics (analytics)
export async function getSiteMetrics(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const siteId = Number(req.params.id);
    if (isNaN(siteId)) {
      return next({
        statusCode: 400,
        message: "Invalid site id",
      });
    }
    const metrics = await SiteService.getSiteMetrics(siteId);
    if (!metrics) {
      return next({
        statusCode: 404,
        message: "Site not found",
      });
    }
    res.json({ status: "success", data: metrics });
  } catch (err) {
    next(err);
  }
}

// Create a new site
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
