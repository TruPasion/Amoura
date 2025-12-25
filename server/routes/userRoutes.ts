import express from "express";
import { RequestHandler } from "express";
import {
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  createUserProfile,
  uploadDelta,
} from "../controllers/userController";

const router = express.Router();
router.post("/", createUser as RequestHandler);
router.put("/:id", updateUser as RequestHandler);
router.delete("/:id", deleteUser as RequestHandler);
router.get("/:id", getUserById as RequestHandler);
router.post("/profiles", createUserProfile as RequestHandler);
router.post("/upload-delta", uploadDelta as RequestHandler);

export default router;
