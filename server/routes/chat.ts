import { Router } from "express";
import { getMatchedUsersMessages } from "../controllers/chatController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/getmessages/:userId", authMiddleware, (req, res, next) => {
  Promise.resolve(getMatchedUsersMessages(req, res)).catch(next);
});

export default router;
