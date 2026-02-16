import { Router } from "express";
import {
  getLatestMeasurements,
  ingestBatchMeasurements,
} from "../controllers/measurementController.js";
import { validateBody } from "../middleware/validateRequest.js";
import { ingestMeasurementsSchema } from "../models/site.schema.js";

const router = Router();
const SITE_ROUTE = "/measurement";

router.get(`${SITE_ROUTE}/latest`, getLatestMeasurements);
router.post(
  "/ingest",
  validateBody(ingestMeasurementsSchema),
  ingestBatchMeasurements,
);

export default router;
