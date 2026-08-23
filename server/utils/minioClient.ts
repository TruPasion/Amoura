import { S3Client } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

dotenv.config();

const endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
const region = process.env.S3_REGION || "us-east-1";
const accessKeyId = process.env.S3_ACCESS_KEY || "admin";
const secretAccessKey = process.env.S3_SECRET_KEY || "admin12345";

// S3_FORCE_PATH_STYLE defaults to true because it is required for the local
// MinIO endpoint (localhost:9000) and is harmless for the existing contract.
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE !== "false";

const minioClient = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle,
});

export default minioClient;
