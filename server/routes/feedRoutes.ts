import { Router } from "express";
import { RequestHandler } from "express";
import { feedUserAction, getMatchedUserProfiles, resetMatches } from "../controllers/feedController";

const router = Router();

router.post("/", (req, res, next) => {
  Promise.resolve(feedUserAction(req, res)).catch(next);
}); // Example route to get nearby users

router.get("/matches/:userId", (req, res, next) => {
  Promise.resolve((async () => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const matchedProfiles = await getMatchedUserProfiles(userId);
    res.json(matchedProfiles);
  })()).catch((error) => {
    console.error("Error fetching matched user profiles:", error);
    res.status(500).json({ error: "Failed to fetch matched user profiles" });
  });
});

router.delete("/reset-matches", (req, res, next) => {
  Promise.resolve(resetMatches(req, res)).catch(next);
});

export default router;
