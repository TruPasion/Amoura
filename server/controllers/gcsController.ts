import { Request, Response } from "express";
import { Storage } from "@google-cloud/storage";
import crypto from "crypto";

const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET!);

// 3️⃣ API: generate upload URL
export async function getUploadUrl(req: Request, res: Response) {
  try {
    const userId = req.user.userId;
    const fileType = req.body.contentType;
    const fileName = crypto.randomUUID();
    const objectPath = `users/${userId}/${fileName}`;
    const file = bucket.file(objectPath);
    const [uploadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 10 * 60 * 1000,
      contentType: fileType,
    });
    res.json({ uploadUrl, objectPath });
  } catch (err) {
    console.error("getUploadUrl error:", err);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
}

// 4️⃣ API: confirm upload (save DB)
export async function confirmUpload(req: Request, res: Response) {
  try {
    const { objectPath } = req.body;
    const userId = req.user.userId;
    // TODO: Save objectPath + userId in DB
    res.sendStatus(200);
  } catch (err) {
    console.error("confirmUpload error:", err);
    res.status(500).json({ error: "Failed to confirm upload" });
  }
}

// 5️⃣ API: generate view URL
export async function getViewUrl(req: Request, res: Response) {
  try {
    // Decode the imageId (which is the GCP object path)
    const objectPath = decodeURIComponent(req.params.imageId);

    // Generate signed URL for the GCP object
    const file = bucket.file(objectPath);
    const [viewUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    res.json({ viewUrl });
  } catch (err) {
    console.error("getViewUrl error:", err);
    res.status(500).json({ error: "Failed to generate view URL" });
  }
}
