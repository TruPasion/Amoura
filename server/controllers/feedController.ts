import { Request, Response } from "express";
import { pool } from "../db/index";

type ActionEntry = {
  user_id: number;
  seen_user_id: number;
  action: "like" | "dislike" | "rewind";
};

// Async background processor for checking and inserting mutual matches
const checkAndInsertMutualMatches = async (likePairs: [number, number][]) => {
  if (likePairs.length === 0) return;

  const client = await pool.connect();
  try {
    const matchValues = likePairs
      .map(([user_id, seen_user_id]) => `(${seen_user_id}, ${user_id})`) // reverse pair
      .join(", ");

    const query = `
      INSERT INTO user_matches (user_id_1, user_id_2, matched_at)
      SELECT
        LEAST(sp1.user_id, sp1.seen_user_id),
        GREATEST(sp1.user_id, sp1.seen_user_id),
        NOW()
      FROM user_seen_profiles sp1
      JOIN (VALUES ${matchValues}) AS new_likes(user_id, seen_user_id)
        ON sp1.user_id = new_likes.user_id AND sp1.seen_user_id = new_likes.seen_user_id
      WHERE sp1.action = 'like'
      ON CONFLICT DO NOTHING;
    `;

    await client.query(query);
  } catch (err) {
    console.error("Error inserting mutual matches:", err);
  } finally {
    client.release();
  }
};

// Main API handler
export const feedUserAction = async (req: Request, res: Response) => {
  const actions: ActionEntry[] = req.body;

  if (!Array.isArray(actions) || actions.length === 0) {
    return res.status(400).json({ error: "Invalid or empty actions list" });
  }

  const likePairs: [number, number][] = [];

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const likeDislikeEntries = actions.filter(
        ({ action }) => action === "like" || action === "dislike"
      );
      const rewindEntries = actions.filter(({ action }) => action === "rewind");

      if (likeDislikeEntries.length > 0) {
        const values = likeDislikeEntries
          .map(({ user_id, seen_user_id, action }) => {
            if (action === "like") likePairs.push([user_id, seen_user_id]);
            return `(${user_id}, ${seen_user_id}, '${action}', NOW())`;
          })
          .join(", ");

        const query = `
          INSERT INTO user_seen_profiles (user_id, seen_user_id, action, seen_at)
          VALUES ${values}
          ON CONFLICT (user_id, seen_user_id)
          DO UPDATE SET action = excluded.action, seen_at = excluded.seen_at;
        `;
        await client.query(query);
      }

      for (const { user_id, seen_user_id } of rewindEntries) {
        // 1. Delete from user_seen_profiles
        await client.query(
          `DELETE FROM user_seen_profiles WHERE user_id = $1 AND seen_user_id = $2;`,
          [user_id, seen_user_id]
        );

        // 2. Delete from user_matches if they were matched
        await client.query(
          `DELETE FROM user_matches 
     WHERE user_id_1 = LEAST($1, $2) AND user_id_2 = GREATEST($1, $2);`,
          [user_id, seen_user_id]
        );
      }

      await client.query("COMMIT");
      res.status(200).json({ message: "Actions processed successfully" });

      // Run background mutual match checker (non-blocking)
      checkAndInsertMutualMatches(likePairs);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error processing actions:", error);
      res.status(500).json({ error: "Internal server error" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
