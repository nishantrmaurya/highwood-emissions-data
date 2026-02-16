import { Router } from "express";
import { createSite, getSiteMetrics } from "../controllers/siteController.js";

const router = Router();

// Analytics endpoint for site metrics
router.get("/sites/:id/metrics", getSiteMetrics);

router.post("/sites", createSite);

export default router;
