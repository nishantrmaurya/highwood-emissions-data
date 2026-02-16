import { Router } from "express";
import { createSite } from "../controllers/siteController.js";

const router = Router();

router.post("/sites", createSite);

export default router;
