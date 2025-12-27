import { Router } from "express";
import { getMatchedUsersMessages, deleteConversation } from "../controllers/chatController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/getmessages/:userId", authMiddleware, (req, res, next) => {
  Promise.resolve(getMatchedUsersMessages(req, res)).catch(next);
});

router.delete("/delete-conversation", authMiddleware, (req, res, next) => {
  Promise.resolve(deleteConversation(req, res)).catch(next);
});

export default router;
