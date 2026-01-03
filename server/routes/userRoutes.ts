import express from "express";
import { RequestHandler } from "express";
import {
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  createUserProfile,
  uploadDelta,
  updateProfile,
  deleteAccount,
} from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();
router.post("/", createUser as RequestHandler);
router.put("/:id", updateUser as RequestHandler);
router.delete("/:id", deleteUser as RequestHandler);
router.get("/:id", getUserById as RequestHandler);
router.post("/profiles", createUserProfile as RequestHandler);
router.post("/upload-delta", uploadDelta as RequestHandler);
router.post("/updateprofile", updateProfile as RequestHandler);
router.post("/delete-account", authMiddleware, deleteAccount as RequestHandler);

export default router;
