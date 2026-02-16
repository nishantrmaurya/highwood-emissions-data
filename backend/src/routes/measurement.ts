import { Router } from "express";
import { getLatestMeasurements } from "../controllers/measurementController.js";

const router = Router();
const SITE_ROUTE = "/measurement";

router.get(`${SITE_ROUTE}/latest`, getLatestMeasurements);
