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

    const measurement = await MeasurementService.addMeasurement(
      siteId,
      req.body,
    );
    if (!measurement) {
      return next({
        statusCode: 404,
        message: "Site not found",
      });
    }

    emitSocketUpdate("measurement.created", measurement);

    res.status(201).json({ status: "success", data: measurement });
  } catch (err) {
    next(err);
  }
}

export async function ingestBatchMeasurements(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await MeasurementService.ingestBatch(req.body);

    if (result.status === "site_not_found") {
      return res.status(404).json({
        status: "error",
        message: "Site not found",
      });
    }

    if (result.status === "client_batch_conflict") {
      return res.status(409).json({
        status: "error",
        message: "client_batch_id is already associated with another site",
        details: { existing_site_id: result.existing_site_id },
      });
    }

    if (result.status === "created") {
      emitSocketUpdate("measurement.batch_ingested", {
        ...result.data,
      });
    }

    res.status(result.status === "created" ? 201 : 200).json({
      status: "success",
      data: {
        ...result.data,
        duplicate_request: result.status === "duplicate",
      },
    });
  } catch (err) {
    next(err);
  }
}
