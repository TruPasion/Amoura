import { Request, Response } from 'express';
import { pool } from '../db/index';

// CREATE user
export const feedUserAction = async (req: Request, res: Response) => {
  const actions = req.body;

  if (!Array.isArray(actions) || actions.length === 0) {
    return res.status(400).json({ error: "Invalid or empty actions list" });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const likeDislikeEntries = actions.filter(({ action }) => action === "like" || action === "dislike");
      const rewindEntries = actions.filter(({ action }) => action === "rewind");

      if (likeDislikeEntries.length > 0) {
        const values = likeDislikeEntries.map(({ user_id, seen_user_id, action }) => `(${user_id}, ${seen_user_id}, '${action}', now())`).join(", ");
        const query = `
          INSERT INTO user_seen_profiles (user_id, seen_user_id, action, seen_at)
          VALUES ${values}
          ON CONFLICT (user_id, seen_user_id)
          DO UPDATE SET action = excluded.action, seen_at = excluded.seen_at;
        `;
        await client.query(query);
      }

      for (const { user_id, seen_user_id } of rewindEntries) {
        const query = `
          DELETE FROM user_seen_profiles
          WHERE user_id = $1 AND seen_user_id = $2;
        `;
        await client.query(query, [user_id, seen_user_id]);
      }

      await client.query("COMMIT");
      return res.status(200).json({ message: "Actions processed successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error processing actions:", error);
      return res.status(500).json({ error: "Internal server error" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error connecting to database:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
