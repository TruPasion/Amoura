import { poolChat } from "../db/postGresChat";
import { Request, Response } from "express";
import { getMatchedUserProfiles } from "./feedController";

export interface Message {
  client_msg_id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  status: "sent" | "delivered" | "read" | "sending" | "failed" | "received";
  conversation_id: string | null;
}

export async function getMatchedUsersMessages(req: Request, res: Response) {
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    // Get matched user IDs and filter out the current user
    const matchedProfiles = await getMatchedUserProfiles(userId);
    const matchedUserIds = matchedProfiles
      .map((profile) => profile.user_id)
      .filter((matchedUserId) => matchedUserId !== userId);

    console.log(`User ${userId} matched with:`, matchedUserIds);

    if (matchedUserIds.length === 0) {
      return res.status(200).json({});
    }

    // Create the result object
    const result: { [key: number]: Message[] } = {};

    // Fetch last 30 messages for each matched user conversation
    const query = `
      WITH ranked_messages AS (
        SELECT 
          m.id,
          m.conversation_id,
          m.client_msg_id,
          m.from_user_id,
          m.to_user_id,
          m.content,
          m.content_type,
          m.status,
          m.created_at,
          m.delivered_at,
          m.read_at,
          m.metadata,
          ROW_NUMBER() OVER (
            PARTITION BY 
              CASE 
                WHEN m.from_user_id = $1 THEN m.to_user_id 
                ELSE m.from_user_id 
              END 
            ORDER BY m.created_at DESC
          ) as rn
        FROM messages m
        WHERE 
          (m.from_user_id = $1 AND m.to_user_id = ANY($2::bigint[])) OR
          (m.from_user_id = ANY($2::bigint[]) AND m.to_user_id = $1)
      )
      SELECT * FROM ranked_messages 
      WHERE rn <= 30
      ORDER BY 
        CASE 
          WHEN from_user_id = $1 THEN to_user_id 
          ELSE from_user_id 
        END,
        created_at ASC
    `;

    const queryResult = await poolChat.query(query, [userId, matchedUserIds]);

    console.log(`Found ${queryResult.rows.length} messages for user ${userId}`);

    // Group messages by conversation partner and collect all messages
    const messagesByUser: { [key: number]: any[] } = {};

    queryResult.rows.forEach((row) => {
      const isFromCurrentUser = parseInt(row.from_user_id) === userId;
      const otherUserId = isFromCurrentUser
        ? parseInt(row.to_user_id)
        : parseInt(row.from_user_id);

      console.log(
        `Message: ${row.from_user_id} -> ${
          row.to_user_id
        }, otherUserId: ${otherUserId}, isFromCurrentUser: ${isFromCurrentUser}, userId: ${userId}, types: ${typeof row.from_user_id}, ${typeof userId}`
      );

      // Skip if somehow the otherUserId is the current user (data consistency check)
      if (otherUserId === userId) {
        console.log(
          `Skipping message where otherUserId equals current userId: ${userId}`
        );
        return;
      }

      // Initialize array if it doesn't exist
      if (!messagesByUser[otherUserId]) {
        messagesByUser[otherUserId] = [];
      }

      // Add the raw message data to process later
      messagesByUser[otherUserId].push(row);
    });

    // Process and sort messages for each conversation
    Object.keys(messagesByUser).forEach((userIdStr) => {
      const otherUserId = parseInt(userIdStr);
      const messages = messagesByUser[otherUserId];

      // Sort messages by timestamp (chronological order)
      messages.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Convert to Message format
      result[otherUserId] = messages.map((row) => {
        const isFromCurrentUser = parseInt(row.from_user_id) === userId;

        // Determine status based on your logic
        let status: Message["status"];
        if (isFromCurrentUser) {
          // Message sent by current user (101 -> 104)
          if (row.delivered_at) {
            status = "delivered";
          } else {
            status = "sent";
          }
        } else {
          // Message received by current user (104 -> 101)
          status = "received";
        }

        return {
          client_msg_id: row.client_msg_id || `msg_${row.id}`,
          from: row.from_user_id.toString(),
          to: row.to_user_id.toString(),
          content: row.content || "",
          timestamp: row.created_at.toISOString(),
          status: status,
          conversation_id: row.conversation_id
            ? row.conversation_id.toString()
            : null,
        };
      });
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching matched users messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
