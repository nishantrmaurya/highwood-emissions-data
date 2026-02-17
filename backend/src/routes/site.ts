import { Router } from "express";
import {
  createSite,
  getAllSites,
  getSiteMetrics,
} from "../controllers/siteController.js";
import { addMeasurement } from "../controllers/measurementController.js";
import {
  createMeasurementSchema,
  createSiteSchema,
} from "../models/site.schema.js";
import { validateBody } from "../middleware/validateRequest.js";

const router = Router();
const SITE_ROUTE = "/sites";

router.get(SITE_ROUTE, getAllSites);

router.get(`${SITE_ROUTE}/:id/metrics`, getSiteMetrics);

router.post(SITE_ROUTE, validateBody(createSiteSchema), createSite);

router.post(
  `${SITE_ROUTE}/:id/measurements`,
  validateBody(createMeasurementSchema),
  addMeasurement,
);

export default router;
