import { Router } from "express";
import { RequestHandler } from "express";
import { feedUserAction } from "../controllers/feedController";

const router = Router();

router.post("/", (req, res, next) => {
	Promise.resolve(feedUserAction(req, res)).catch(next);
}); // Example route to get nearby users

export default router;
