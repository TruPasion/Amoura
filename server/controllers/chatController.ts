import { poolChat } from "../db/postGresChat";
import { Request, Response } from "express";
import { getMatchedUserProfiles } from "./feedController";
import { redis } from "../db/redisClient";
export interface Message {
  client_msg_id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  status: "sent" | "delivered" | "read" | "sending" | "failed" | "received";
  conversation_id: string | null;
  read_timestamp?: string | null;
  delivered_timestamp?: string | null;
  created_at?: string;
}

export interface ChatData {
  messages: Message[];
  unread?: number; // Optional, defaults to 0
}

export async function getMatchedUsersMessages(req: Request, res: Response) {
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    // Get matched user IDs and filter out the current user
    const matchedProfiles = await getMatchedUserProfiles(userId);
    const userCameOnlineTime = new Date(
      Date.now() - 5.5 * 60 * 60 * 1000
    ).toISOString();
    const matchedUserIds = matchedProfiles
      .map((profile) => profile.user_id)
      .filter((matchedUserId) => matchedUserId !== userId);

    console.log(`User ${userId} matched with:`, matchedUserIds);

    if (matchedUserIds.length === 0) {
      return res.status(200).json({});
    }

    // Create the result object
    const result: { [key: number]: ChatData } = {};

    // Fetch ALL unread messages + 30 older messages for each conversation
    const query = `
      WITH unread_messages AS (
        SELECT 
          m.*,
          'unread' as message_type
        FROM messages m
        WHERE 
          m.to_user_id = $1 
          AND m.from_user_id = ANY($2::bigint[])
          AND m.read_at IS NULL
      ),
      older_messages AS (
        SELECT 
          m.*,
          'older' as message_type,
          ROW_NUMBER() OVER (
            PARTITION BY 
              CASE 
                WHEN m.from_user_id = $1 THEN m.to_user_id 
                ELSE m.from_user_id 
              END 
            ORDER BY m.created_at DESC
          ) as rn_older
        FROM messages m
        WHERE 
          ((m.from_user_id = $1 AND m.to_user_id = ANY($2::bigint[])) OR
           (m.from_user_id = ANY($2::bigint[]) AND m.to_user_id = $1))
          AND (m.to_user_id != $1 OR m.read_at IS NOT NULL)
      ),
      unread_counts AS (
        SELECT 
          from_user_id as other_user_id,
          COUNT(*) as unread_count
        FROM messages 
        WHERE 
          from_user_id = ANY($2::bigint[]) 
          AND to_user_id = $1 
          AND read_at IS NULL
        GROUP BY from_user_id
      ),
      combined_messages AS (
        SELECT 
          id, conversation_id, client_msg_id, from_user_id, to_user_id,
          content, content_type, status, created_at, delivered_at, read_at, metadata,
          message_type
        FROM unread_messages
        UNION ALL
        SELECT 
          id, conversation_id, client_msg_id, from_user_id, to_user_id,
          content, content_type, status, created_at, delivered_at, read_at, metadata,
          message_type
        FROM older_messages 
        WHERE rn_older <= 30
      )
      SELECT 
        cm.*,
        COALESCE(uc.unread_count, 0) as unread_count
      FROM combined_messages cm
      LEFT JOIN unread_counts uc ON (
        CASE 
          WHEN cm.from_user_id = $1 THEN cm.to_user_id 
          ELSE cm.from_user_id 
        END = uc.other_user_id
      )
      ORDER BY 
        CASE 
          WHEN cm.from_user_id = $1 THEN cm.to_user_id 
          ELSE cm.from_user_id 
        END,
        cm.created_at ASC
    `;

    const queryResult = await poolChat.query(query, [userId, matchedUserIds]);

    console.log(`Found ${queryResult.rows.length} messages for user ${userId}`);

    // Group messages by conversation partner
    const messagesByUser: {
      [key: number]: { messages: any[]; unreadCount: number };
    } = {};

    queryResult.rows.forEach((row) => {
      const isFromCurrentUser = parseInt(row.from_user_id) === userId;
      const otherUserId = isFromCurrentUser
        ? parseInt(row.to_user_id)
        : parseInt(row.from_user_id);

      // Skip if somehow the otherUserId is the current user (data consistency check)
      if (otherUserId === userId) {
        console.log(
          `Skipping message where otherUserId equals current userId: ${userId}`
        );
        return;
      }

      // Initialize object if it doesn't exist
      if (!messagesByUser[otherUserId]) {
        messagesByUser[otherUserId] = {
          messages: [],
          unreadCount: parseInt(row.unread_count) || 0,
        };
      }

      // Add the message
      messagesByUser[otherUserId].messages.push(row);
    });

    // Process messages for each conversation (no need to sort as query already orders them)
    Object.keys(messagesByUser).forEach((userIdStr) => {
      const otherUserId = parseInt(userIdStr);
      const { messages, unreadCount } = messagesByUser[otherUserId];

      // Convert to Message format
      const formattedMessages: Message[] = messages.map((row) => {
        const isFromCurrentUser = parseInt(row.from_user_id) === userId;

        // Determine status based on your logic
        let status: Message["status"];
        if (isFromCurrentUser) {
          // Message sent by current user (101 -> 104)
          if (row.read_at) {
            status = "read";
          } else if (row.delivered_at) {
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
          timestamp: row.created_at,
          status: status,
          conversation_id: row.conversation_id
            ? row.conversation_id.toString()
            : null,
          // Add timestamp fields for all messages except received
          ...(status !== "received"
            ? {
                read_timestamp: row.read_at || null,
                delivered_timestamp: row.delivered_at || null,
              }
            : {
                read_timestamp: null,
                delivered_timestamp: row.delivered_at || userCameOnlineTime,
              }),
        };
      });

      // Create ChatData object with pre-calculated unread count
      result[otherUserId] = {
        messages: formattedMessages,
        unread: unreadCount,
      };
    });

    // Ensure every matched user is present in the result, even if no messages
    matchedUserIds.forEach((matchedUserId) => {
      if (!result[matchedUserId]) {
        result[matchedUserId] = {
          messages: [],
          unread: 0,
        };
      }
    });

    res.status(200).json(result);
    seperateThreadExecution(userId, matchedUserIds);
  } catch (error) {
    console.error("Error fetching matched users messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const updateDeliveredStatus = async (
  sender_user_id: number,
  receiver_user_id: number
) => {
  try {
    // Initialize current timestamp for delivery (UTC)
    const deliveredTime = new Date().toISOString();

    // Update all undelivered messages FROM sender TO receiver
    // (messages that receiver is now viewing, so sender gets double ticks)
    const updateQuery = `
      UPDATE messages 
      SET 
        delivered_at = $3,
        status = 'delivered'
      WHERE 
        from_user_id = $1 
        AND to_user_id = $2 
        AND delivered_at IS NULL
      RETURNING 
        id,
        client_msg_id,
        created_at,
        delivered_at
    `;

    const result = await poolChat.query(updateQuery, [
      sender_user_id,
      receiver_user_id,
      deliveredTime,
    ]);

    console.log(
      `Updated ${result.rows.length} messages to delivered status from user ${sender_user_id} to user ${receiver_user_id}`
    );

    if (result.rows.length === 0) {
      console.log(
        `No undelivered messages found from user ${sender_user_id} to user ${receiver_user_id}`
      );
      return {};
    }
    return {
      sender_user_id: sender_user_id,
      receiver_user_id: receiver_user_id,
      delivery: result.rows.map((row) => ({
        receiver_user_id: receiver_user_id,
        id: row.client_msg_id,
        delivered_at: new Date(
          row.delivered_at.getTime() + 5.5 * 60 * 60 * 1000
        ).toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error updating message status:", error);
    throw error;
  }
};

const seperateThreadExecution = async (
  userId: number,
  matchedUserIds: number[]
) => {
  matchedUserIds.forEach(async (matchedUserId) => {
    const data = await updateDeliveredStatus(matchedUserId, userId);
    console.log("Delivery status updated:", data, userId, matchedUserId);
    //stringify the data and add it into redis stream
    if (data && data.delivery && data.delivery.length > 0) {
      console.log("Adding delivery data to redis stream:", data);
      try {
        await redis.xAdd("delivery_stream", "*", {
          data: JSON.stringify(data),
          type: "delivery",
        });
      } catch (redisErr) {
        console.error(
          "⚠️  Failed to add delivery data to Redis stream:",
          redisErr
        );
        console.log(
          "📝 Delivery status was still updated in database successfully"
        );
      }
    }
  });
};
