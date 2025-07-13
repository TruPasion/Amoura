import { Request, Response } from 'express';
import { pool } from '../db/index';

// CREATE user
export const feedUserAction = async (req: Request, res: Response) => {
  const { user_id, seen_user_id, action } = req.body;

  if (!user_id || !seen_user_id || !action) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    if (action === "like" || action === "dislike") {
      // Insert or update entry
      const query = `
        INSERT INTO user_seen_profiles (user_id, seen_user_id, action, seen_at)
        VALUES ($1, $2, $3, now())
        ON CONFLICT (user_id, seen_user_id)
        DO UPDATE SET action = $3, seen_at = now();
      `;
      await pool.query(query, [user_id, seen_user_id, action]);
      return res.status(200).json({ message: "Action recorded successfully" });
    } else if (action === "rewind") {
      // Delete entry if exists
      const query = `
        DELETE FROM user_seen_profiles
        WHERE user_id = $1 AND seen_user_id = $2;
      `;
      await pool.query(query, [user_id, seen_user_id]);
      return res.status(200).json({ message: "Rewind action completed successfully" });
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }
  } catch (error) {
    console.error("Error handling user action:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
