import { Request, Response } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
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
  return `${randomUUID()}-${sanitizeFilename(filename)}`;
}

/**
 * Upload a multipart image to MinIO.
 *
 * Public API contract remains unchanged:
 *   POST /api/upload (multipart field: image)
 *   -> { message, fileUrl }
 *
 * We intentionally buffer the bounded image before calling PutObjectCommand.
 * AWS SDK v3's flexible-checksum middleware cannot safely calculate the
 * x-amz-decoded-content-length header for an arbitrary PassThrough stream.
 * Passing a Buffer + explicit ContentLength makes the request deterministic
 * for MinIO and avoids the ERR_HTTP_INVALID_HEADER_VALUE error.
 *
 * MAX_UPLOAD_BYTES defaults to 10 MB, so this is bounded memory usage and is
 * appropriate for profile images. Busboy still streams the HTTP request into
 * memory rather than buffering the entire multipart request internally.
 */
export const uploadToMinIO = (req: Request, res: Response) => {
  console.log("UPLOAD: controller entered");

  let fileSeen = false;
  let bytesReceived = 0;
  let uploadPromise: Promise<unknown> | null = null;
  let objectKey = "";
  let responseSent = false;
  let fileChunks: Buffer[] = [];

  const sendError = (status: number, message: string, error?: unknown) => {
    if (responseSent || res.headersSent) return;
    responseSent = true;
    if (error) console.error("UPLOAD:", message, error);
    else console.error("UPLOAD:", message);
    res.status(status).json({
      message,
      error: error instanceof Error ? error.message : undefined,
    });
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
      fileChunks = [];

      file.on("data", (chunk: Buffer) => {
        bytesReceived += chunk.length;
        fileChunks.push(chunk);
      });

      file.on("limit", () => {
        console.warn("UPLOAD: image exceeded size limit", {
          maxBytes: MAX_UPLOAD_BYTES,
        });
        fileChunks = [];
        sendError(413, "Image is too large");
      });

      file.on("error", (error) => {
        fileChunks = [];
        sendError(500, "Incoming upload stream failed", error);
      });

      file.on("end", () => {
        if (responseSent) return;

        const body = Buffer.concat(fileChunks);
        fileChunks = [];

        // The stream is now a known-size Buffer. Explicit ContentLength is
        // important here: it prevents AWS SDK v3's checksum middleware from
        // producing an undefined x-amz-decoded-content-length header.
        console.log("UPLOAD: starting MinIO upload", {
          bucket: BUCKET,
          key: objectKey,
          contentLength: body.length,
        });

        uploadPromise = minioClient.send(
          new PutObjectCommand({
            Bucket: BUCKET,
            Key: objectKey,
            Body: body,
            ContentLength: body.length,
            ContentType: info.mimeType,
          }),
        );
      });
    });

    bb.on("filesLimit", () => {
      sendError(400, "Only one image can be uploaded per request");
    });

    bb.on("error", (error: Error) => {
      sendError(400, "Invalid multipart upload", error);
    });

    bb.on("close", async () => {
      console.log("UPLOAD: busboy finish", {
        fileSeen,
        bytesReceived,
        objectKey,
      });

      if (responseSent) return;
      if (!fileSeen) {
        sendError(400, "No image uploaded");
        return;
      }
      if (!uploadPromise) {
        // For a normal file, the `end` event fires before Busboy `close`.
        // Keep this guard so malformed/aborted multipart requests fail cleanly.
        sendError(500, "Upload could not be started");
        return;
      }

      try {
        await uploadPromise;
        if (responseSent) return;

        responseSent = true;
        const fileUrl = `/uploads/${objectKey}`;
        console.log("UPLOAD: MinIO upload completed", {
          fileUrl,
          bytesReceived,
        });
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
      fileChunks = [];
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