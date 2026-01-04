import express from "express";
import {
  getUploadUrl,
  confirmUpload,
  getViewUrl,
} from "../controllers/gcsController";

const router = express.Router();

// Generate signed upload URL (requires auth from parent router)
router.post("/upload-url", getUploadUrl);
// Confirm upload (save DB)
router.post("/confirm-upload", confirmUpload);
// Generate signed view URL (requires auth from parent router)
router.get("/view-url/:imageId", getViewUrl);

export default router;
