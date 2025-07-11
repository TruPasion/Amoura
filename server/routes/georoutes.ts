import { Router } from "express";
import { RequestHandler } from "express";
import { getNearbyUsers } from "../controllers/geoController";

const router = Router();

router.post("/getnearbyusers", getNearbyUsers as RequestHandler); // Example route to get nearby users

export default router;
