import { Request, Response } from "express";
import {
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import minioClient from "../utils/minioClient.js";
import dotenv from "dotenv";
import { Readable } from "stream";

dotenv.config();

const BUCKET = process.env.S3_BUCKET || "uploads";

const getObjectKey = (pathParam: string | string[] | undefined): string | null => {
  if (!pathParam) {
    return null;
  }

  // Express 5 named wildcard parameters can be string[]
  const path = Array.isArray(pathParam)
    ? pathParam.join("/")
    : pathParam;

  // Remove /uploads/ if it happens to be included.
  return path.replace(/^\/?uploads\//, "");
};

// Download file from MinIO
export const downloadFromMinIO = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const objectKey = getObjectKey(req.params.path);

    if (!objectKey) {
      res.status(400).json({ message: "File path is required" });
      return;
    }

    const getCommand = new GetObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
    });

    const response = await minioClient.send(getCommand);

    if (!response.Body) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    res.setHeader(
      "Content-Type",
      response.ContentType || "application/octet-stream"
    );

    if (response.ContentLength !== undefined) {
      res.setHeader("Content-Length", response.ContentLength.toString());
    }

    if (response.Body instanceof Readable) {
      response.Body.on("error", (error) => {
        console.error("MinIO stream error:", error);

        if (!res.headersSent) {
          res.status(500).json({ message: "Download failed" });
        } else {
          res.destroy(error);
        }
      });

      response.Body.pipe(res);
      return;
    }

    // AWS SDK v3 can return other body types depending on runtime.
    // Convert async iterable bodies into the Express response.
    if (
      typeof (response.Body as any)[Symbol.asyncIterator] === "function"
    ) {
      for await (const chunk of response.Body as any) {
        res.write(chunk);
      }

      res.end();
      return;
    }

    res.status(404).json({ message: "File not found" });
  } catch (error) {
    console.error("Download error:", error);

    if ((error as any)?.name === "NoSuchKey") {
      res.status(404).json({ message: "File not found" });
      return;
    }

    if (!res.headersSent) {
      res.status(500).json({
        message: "Download failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
};

// Delete file from MinIO
export const deleteFromMinIO = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const objectKey = getObjectKey(req.params.path);

    if (!objectKey) {
      res.status(400).json({ message: "File path is required" });
      return;
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
    });

    await minioClient.send(deleteCommand);

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);

    if ((error as any)?.name === "NoSuchKey") {
      res.status(404).json({ message: "File not found" });
      return;
    }

    res.status(500).json({
      message: "Delete failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};