import { Request, Response } from "express";
import { pool } from "../db/postGres";
import { poolChat } from "../db/postGresChat";
import { redis } from "../db/redisClient";

type ActionEntry = {
  user_id: number;
  seen_user_id: number;
  action: "like" | "dislike" | "rewind";
};

// Remove match from Redis stream by UUID
const removeMatchFromRedis = async (matchId: string) => {
  try {
    const deletedCount = await redis.xDel("match_stream", matchId);
    if (deletedCount > 0) {
      console.log(`Deleted match_stream entry with ID: ${matchId}`);
    } else {
      console.log(`No Redis match_stream entry found for ID: ${matchId}`);
    }
  } catch (err) {
    console.error("Error deleting Redis stream entry:", err);
  }
};

// Async background processor for checking and inserting mutual matches
const checkAndInsertMutualMatches = async (likePairs: [number, number][]) => {
  if (likePairs.length === 0) return;

  const client = await pool.connect();
  try {
    // Insert matches and return the inserted rows including the UUID id
    const matchValues = likePairs
      .map(([user_id, seen_user_id]) => `(${seen_user_id}, ${user_id})`) // reverse pair
      .join(", ");

    const query = `
      INSERT INTO user_matches (user_id_1, user_id_2)
      SELECT
        LEAST(sp1.user_id, sp1.seen_user_id),
        GREATEST(sp1.user_id, sp1.seen_user_id)
      FROM user_seen_profiles sp1
      JOIN (VALUES ${matchValues}) AS new_likes(user_id, seen_user_id)
        ON sp1.user_id = new_likes.user_id AND sp1.seen_user_id = new_likes.seen_user_id
      WHERE sp1.action = 'like'
      ON CONFLICT DO NOTHING
      RETURNING match_id, user_id_1, user_id_2;
    `;

    const result = await client.query(query);

    // Fetch usernames for the matched users
    for (const row of result.rows) {
      const userQuery = `
        SELECT full_name FROM user_profiles WHERE user_id = $1;
      `;

      const user1Res = await client.query(userQuery, [row.user_id_1]);
      const user2Res = await client.query(userQuery, [row.user_id_2]);

      const user1Name = user1Res.rows[0]?.full_name || "Unknown";
      const user2Name = user2Res.rows[0]?.full_name || "Unknown";

      // Push newly created matches to Redis stream with UUID id and usernames
      try {
        await redis.xAdd("match_stream", "*", {
          id: row.match_id, // UUID string
          user_id_1: row.user_id_1.toString(),
          user_id_2: row.user_id_2.toString(),
          user_name_1: user1Name,
          user_name_2: user2Name,
          type: "match",
        });
      } catch (redisErr) {
        console.error("⚠️  Failed to add match to Redis stream:", redisErr);
        console.log("📝 Match was still created in database successfully");
      }
    }
  } catch (err) {
    console.error("Error inserting mutual matches:", err);
  } finally {
    client.release();
  }
};

// Function to fetch matched user profiles
export const getMatchedUserProfiles = async (userId: number) => {
  const client = await pool.connect();

  try {
    const query = `
  WITH matched_users AS (
    SELECT 
      CASE 
        WHEN user_id_1 = $1 THEN user_id_2
        ELSE user_id_1
      END AS matched_user_id
    FROM user_matches
    WHERE user_id_1 = $1 OR user_id_2 = $1
  )
  SELECT 
    up.user_id,
    up.full_name,

    -- primary photo (same alias as before)
    MAX(CASE WHEN upp.is_primary = true THEN upp.image_url END) AS profile_photo,

    -- all photos array (includes primary)
    ARRAY_REMOVE(
      ARRAY_AGG(upp.image_url ORDER BY upp.position),
      NULL
    ) AS photos

  FROM matched_users mu
  JOIN user_profiles up 
    ON mu.matched_user_id = up.user_id
  LEFT JOIN user_profile_pictures upp
    ON upp.user_id = up.user_id

  GROUP BY 
    up.user_id,
    up.full_name
`;

    const result = await client.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error("Error fetching matched user profiles:", error);
    throw new Error("Failed to fetch matched user profiles");
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
            return `(${user_id}, ${seen_user_id}, '${action}', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`;
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
        console.log(typeof user_id, user_id);
        console.log(typeof seen_user_id, seen_user_id);

        // 1. Delete from user_seen_profiles
        await client.query(
          `DELETE FROM user_seen_profiles WHERE user_id = $1::integer AND seen_user_id = $2::integer;`,
          [user_id, seen_user_id]
        );

        // 2. Get match id from user_matches for deletion
        const matchRes = await client.query(
          `SELECT match_id FROM user_matches WHERE user_id_1 = LEAST($1::integer, $2::integer) AND user_id_2 = GREATEST($1::integer, $2::integer);`,
          [user_id, seen_user_id]
        );
        if ((matchRes.rowCount ?? 0) > 0) {
          const matchId = matchRes.rows[0].match_id;

          // 3. Delete from user_matches
          await client.query(`DELETE FROM user_matches WHERE match_id = $1;`, [
            matchId,
          ]);

          // 4. Delete from Redis stream by match UUID
          await removeMatchFromRedis(matchId);
        }
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

// Reset matches + chats endpoint
export const resetMatches = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized - User ID not found in token" });
  }

  const clientMain = await pool.connect(); // main DB
  const clientChat = await poolChat.connect(); // chat DB

  try {
    // Check user eligibility for reset
    const resetCheckQuery = `
      SELECT reset_at,
             EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' - COALESCE(reset_at, '1970-01-01'::timestamp))) / 86400 AS days_since_reset
      FROM users 
      WHERE id = $1
    `;

    const resetResult = await clientMain.query(resetCheckQuery, [userId]);

    if (resetResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { reset_at, days_since_reset } = resetResult.rows[0];

    // If user has reset before and it's been less than 5 days
    if (reset_at && days_since_reset < 5) {
      const daysLeft = Math.ceil(5 - days_since_reset);
      return res.status(423).json({
        error: "Reset cooldown active",
        message: `You can reset your matches again in ${daysLeft} day${
          daysLeft > 1 ? "s" : ""
        }`,
        daysLeft: daysLeft,
      });
    }

    // Begin both transactions
    await clientMain.query("BEGIN");
    await clientChat.query("BEGIN");

    // ===== MAIN DB OPERATIONS =====

    // Delete seen profiles
    await clientMain.query(
      `DELETE FROM user_seen_profiles
       WHERE user_id = $1 OR seen_user_id = $1`,
      [userId]
    );

    // Delete matches
    await clientMain.query(
      `DELETE FROM user_matches
       WHERE user_id_1 = $1 OR user_id_2 = $1`,
      [userId]
    );

    // Update reset timestamp
    await clientMain.query(
      `UPDATE users SET reset_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC' WHERE id = $1`,
      [userId]
    );

    // ===== CHAT DB OPERATIONS =====

    // Delete messages FIRST
    await clientChat.query(
      `DELETE FROM messages
       WHERE from_user_id = $1 OR to_user_id = $1`,
      [userId]
    );

    // Delete conversations
    await clientChat.query(
      `DELETE FROM conversations
       WHERE user1_id = $1 OR user2_id = $1`,
      [userId]
    );

    // Commit both transactions
    await clientMain.query("COMMIT");
    await clientChat.query("COMMIT");

    return res.status(200).json({
      message: "Account reset successfully (matches + chats cleared)",
      userId,
    });
  } catch (error) {
    // Rollback both transactions if anything fails
    try {
      await clientMain.query("ROLLBACK");
      await clientChat.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Error during rollback:", rollbackError);
    }

    console.error("Error resetting account:", error);

    return res.status(500).json({
      error: "Failed to reset account",
    });
  } finally {
    clientMain.release();
    clientChat.release();
  }
};

// unmatch user endpoint
export const unmatchUser = async (req: Request, res: Response) => {
  const currentUserId = (req as any).user?.userId; // Get current user ID from token
  const { userId } = req.body; // Get target user ID from payload

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (!currentUserId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const clientMain = await pool.connect(); // main DB
  const clientChat = await poolChat.connect(); // chat DB

  try {
    // Begin both transactions
    await clientMain.query("BEGIN");
    await clientChat.query("BEGIN");

    // Delete matches
    await clientMain.query(
      `
      DELETE FROM user_matches
      WHERE (user_id_1 = $1 AND user_id_2 = $2)
         OR (user_id_1 = $2 AND user_id_2 = $1)
      `,
      [currentUserId, userId]
    );

    // ===== CHAT DB =====

    // Delete messages FIRST
    await clientChat.query(
      `
      DELETE FROM messages
      WHERE (from_user_id = $1 AND to_user_id = $2)
         OR (from_user_id = $2 AND to_user_id = $1)
      `,
      [currentUserId, userId]
    );

    // Delete conversations
    await clientChat.query(
      `
      DELETE FROM conversations
      WHERE (user1_id = $1 AND user2_id = $2)
         OR (user1_id = $2 AND user2_id = $1)
      `,
      [currentUserId, userId]
    );

    // Commit both
    await clientMain.query("COMMIT");
    await clientChat.query("COMMIT");

    return res.status(200).json({
      message: "User unmatched successfully",
      currentUserId,
      unmatchedUserId: userId,
    });
  } catch (error) {
    // Rollback both transactions on error
    await clientMain.query("ROLLBACK");
    await clientChat.query("ROLLBACK");

    console.error("Error unmatching user:", error);
    return res.status(500).json({ error: "Failed to unmatch user" });
  } finally {
    clientMain.release();
    clientChat.release();
  }
};
