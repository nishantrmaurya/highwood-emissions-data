import { Request, Response, NextFunction } from "express";
import { SiteService } from "../services/siteService.js";
import { emitSocketUpdate } from "../socket/socketServer.js";

export async function getAllSites(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const sites = await SiteService.getAllSites();
    res.json({ status: "success", data: sites });
  } catch (err) {
    next(err);
  }
}

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
    const site = await SiteService.createSite(req.body);
    emitSocketUpdate("site.created", {
      id: site.id,
      site_name: site.site_name,
      site_type: site.site_type,
      created_at: site.created_at,
    });
    res.status(201).json({ status: "success", data: site });
  } catch (err) {
    next(err);
  }
}

export async function addMeasurement(
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

    const measurement = await SiteService.addMeasurement(siteId, req.body);
    if (!measurement) {
      return next({
        statusCode: 404,
        message: "Site not found",
      });
    }

    emitSocketUpdate("measurement.created", {
      id: measurement.id,
      site_id: measurement.site_id,
      measured_at: measurement.measured_at,
      emission_value: measurement.emission_value,
      unit: measurement.unit,
      created_at: measurement.created_at,
    });

    res.status(201).json({ status: "success", data: measurement });
  } catch (err) {
    next(err);
  }
}
