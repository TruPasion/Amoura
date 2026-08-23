import express from "express";
import { downloadFromMinIO } from "../controllers/downloadController.js";

const router = express.Router();

// Download endpoint for serving files from MinIO
router.get("/uploads/*", downloadFromMinIO);

export default router;