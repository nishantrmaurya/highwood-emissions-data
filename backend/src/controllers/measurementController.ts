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
        batch_id: result.data.batch_id,
        site_id: result.data.site_id,
        client_batch_id: result.data.client_batch_id,
        inserted_count: result.data.inserted_count,
        total_emissions_to_date: result.data.total_emissions_to_date,
        last_measurement_at: result.data.last_measurement_at,
        current_compliance_status: result.data.current_compliance_status,
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
