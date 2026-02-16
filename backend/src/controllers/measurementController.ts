import { NextFunction, Request, Response } from "express";
import { MeasurementService } from "../services/measurementService.js";
import { emitSocketUpdate } from "../socket/socketServer.js";

export async function getLatestMeasurements(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const measurements = await MeasurementService.getLatestMeasurements();
    res.json({ status: "success", data: measurements });
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

    const measurement = await MeasurementService.addMeasurement(siteId, req.body);
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
