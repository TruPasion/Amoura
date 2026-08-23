import { Request, Response } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { PassThrough } from "stream";
import busboy from "busboy";
import dotenv from "dotenv";
import minioClient from "../utils/minioClient.js";

dotenv.config();

const BUCKET = process.env.S3_BUCKET || "uploads";
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024);

function sanitizeFilename(filename: string): string {
  const base = filename.split(/[\\/]/).pop() || "photo";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.slice(-160) || "photo";
}

function createObjectKey(filename: string): string {
  return `profiles/${randomUUID()}-${sanitizeFilename(filename)}`;
}

/**
 * Upload a multipart image directly to MinIO.
 *
 * The public API contract intentionally remains unchanged:
 *   POST /api/upload (multipart field: image)
 *   -> { message, fileUrl }
 *
 * Important: the MinIO upload is started inside Busboy's `file` event. Waiting
 * until Busboy's `close` event before starting the S3 upload would mean the
 * incoming stream has already been consumed and can result in empty/truncated
 * uploads.
 */
export const uploadToMinIO = (req: Request, res: Response) => {
  console.log("UPLOAD: controller entered");

  let fileSeen = false;
  let bytesReceived = 0;
  let uploadPromise: Promise<unknown> | null = null;
  let objectKey = "";
  let responseSent = false;

  const sendError = (status: number, message: string, error?: unknown) => {
    if (responseSent || res.headersSent) return;
    responseSent = true;
    if (error) console.error("UPLOAD:", message, error);
    else console.error("UPLOAD:", message);
    res.status(status).json({ message, error: error instanceof Error ? error.message : undefined });
  };

  try {
    const bb = busboy({
      headers: req.headers,
      limits: { files: 1, fileSize: MAX_UPLOAD_BYTES },
    });

    bb.on("file", (fieldname, file, info) => {
      console.log("UPLOAD: file event", {
        fieldname,
        filename: info.filename,
        mimeType: info.mimeType,
      });

      if (fieldname !== "image" || fileSeen) {
        file.resume();
        return;
      }

      fileSeen = true;

      if (!info.mimeType?.startsWith("image/")) {
        file.resume();
        sendError(415, "Only image uploads are supported");
        return;
      }

      objectKey = createObjectKey(info.filename || "photo");

      const uploadBody = new PassThrough();

      file.on("data", (chunk: Buffer) => {
        bytesReceived += chunk.length;
      });

      file.on("limit", () => {
        console.warn("UPLOAD: image exceeded size limit", { maxBytes: MAX_UPLOAD_BYTES });
        uploadBody.destroy(new Error("Upload exceeds the maximum allowed size"));
        sendError(413, "Image is too large");
      });

      file.on("error", (error) => {
        uploadBody.destroy(error);
        sendError(500, "Incoming upload stream failed", error);
      });

      console.log("UPLOAD: starting MinIO upload", {
        bucket: BUCKET,
        key: objectKey,
      });

      // Start consuming the request stream immediately. Do not defer this to
      // Busboy's close event or the stream may already be exhausted.
      uploadPromise = minioClient.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: objectKey,
          Body: uploadBody,
          ContentType: info.mimeType,
        }),
      );
      file.pipe(uploadBody);
    });

    bb.on("filesLimit", () => {
      sendError(400, "Only one image can be uploaded per request");
    });

    bb.on("error", (error: Error) => {
      sendError(400, "Invalid multipart upload", error);
    });

    bb.on("close", async () => {
      console.log("UPLOAD: busboy finish", { fileSeen, bytesReceived, objectKey });

      if (responseSent) return;
      if (!fileSeen) {
        sendError(400, "No image uploaded");
        return;
      }
      if (!uploadPromise) {
        sendError(500, "Upload could not be started");
        return;
      }

      try {
        await uploadPromise;
        if (responseSent) return;

        responseSent = true;
        const fileUrl = `/uploads/${objectKey}`;
        console.log("UPLOAD: MinIO upload completed", { fileUrl, bytesReceived });
        res.json({
          message: "File uploaded successfully",
          fileUrl,
        });
      } catch (error) {
        sendError(500, "MinIO upload failed", error);
      }
    });

    req.on("aborted", () => {
      console.warn("UPLOAD: client aborted request");
      if (!responseSent) responseSent = true;
    });

    req.on("error", (error) => {
      sendError(500, "Upload request failed", error);
    });

    req.pipe(bb);
  } catch (error) {
    sendError(500, "Upload controller failed", error);
  }
};
