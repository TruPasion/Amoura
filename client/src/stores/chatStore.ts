import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useUserStore } from "./user";
import { useActionStore } from "./actionStore";
import type { UserStatus, ChatData } from "../utils/types";
import type { Message } from "../utils/types";

export const useChatStore = defineStore("chat", () => {
  const ws = ref<WebSocket | null>(null);
  const pingInterval = ref<number | null>(null);
  const reconnectTimeout = ref<number | null>(null);
  const openedChat = ref<number | null>(null);
  const userMessages = ref<Record<number, ChatData>>({});
  const userStatus = ref<UserStatus | null>(null);
  const actionStore = useActionStore();
  const { chatUser } = storeToRefs(actionStore);

  // Single queue for delivery and read events
  const statusUpdateQueue = ref<any[]>([]);

  // Process delivery events
  const processDeliveryEvent = (data: any) => {
    const userId = data.user_id;
    const deliveryData = data.delivery;

    // Get chat data for the user
    const chatData = userMessages.value[userId];
    if (chatData && chatData.messages) {
      // Iterate through messages and update delivery status
      chatData.messages.forEach((message) => {
        if (
          message.client_msg_id &&
          deliveryData[message.client_msg_id] &&
          message.status !== "read"
        ) {
          message.delivered_timestamp = deliveryData[message.client_msg_id];
          message.status = "delivered";
        }
      });
      console.log(
        `Updated delivery status for ${
          Object.keys(deliveryData).length
        } messages for user ${userId}`
      );
    }
  };

  // Process read events
  const processReadEvent = (data: any) => {
    const userId = data.user_id;
    const readData = data.read;

    // Get chat data for the user
    const chatData = userMessages.value[userId];
    if (chatData && chatData.messages) {
      // Iterate through messages and update read status
      chatData.messages.forEach((message) => {
        if (message.client_msg_id && readData[message.client_msg_id]) {
          message.read_timestamp = readData[message.client_msg_id];
          message.status = "read";
        }
      });
      console.log(
        `Updated read status for ${
          Object.keys(readData).length
        } messages for user ${userId}`
      );
    }
  };

  // Processing flag and queue processor
  let processingStatusQueue = false;

  const processStatusQueue = async () => {
    if (processingStatusQueue || statusUpdateQueue.value.length === 0) return;

    processingStatusQueue = true;

    while (statusUpdateQueue.value.length > 0) {
      const item = statusUpdateQueue.value.shift();
      if (item) {
        try {
          if (item.type === "delivery") {
            processDeliveryEvent(item);
          } else if (item.type === "read") {
            processReadEvent(item);
          }
          // Small delay to prevent blocking
          await new Promise((resolve) => setTimeout(resolve, 0));
        } catch (error) {
          console.error("Error processing status update:", error);
        }
      }
    }

    processingStatusQueue = false;
  };

  const setOpenedChat = (userId: number | null) => {
    openedChat.value = userId;
    if (userId !== null) {
      // Ensure the user entry exists before accessing unread property
      if (!userMessages.value[userId]) {
        userMessages.value[userId] = {
          messages: [],
          unread: 0,
        };
      }
      userMessages.value[userId].unread = 0; // Reset unread count when opening chat
    }
  };

  const resetOpenedChat = () => {
    openedChat.value = null;
  };

  const connectWebSocket = (userId: number | undefined) => {
    const userStore = useUserStore();
    const wsurl =
      import.meta.env.wsenv === "production"
        ? "wss://amoura.dev/ws"
        : "ws://localhost:8000/ws";
    ws.value = new WebSocket(wsurl);

    ws.value.onopen = () => {
      console.log("✅ WebSocket connected");

      // Send onboarding payload
      if (userId !== undefined) {
        const payload = JSON.stringify({ user_id: userId });
        ws.value?.send(payload);
      }

      // Start ping interval
      startPing();
    };

    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);

        if (data.type === "pong") {
          console.log("✅ Pong from server");
        } else if (
          data.type === "onboard_response" ||
          data.type === "status_update"
        ) {
          if (chatUser.value?.user_id === data.data.user_id) {
            userStatus.value = {
              user_id: data.data.user_id,
              status: data.data.status,
              last_seen: data.data.last_seen,
            };
            console.log("User status updated:", userStatus.value);
          }
        } else if (data.type === "match") {
          actionStore.getMatches(userId!);
          userStore.setMessage(
            data.message || "You have a new match!",
            "success",
            5000
          );

          // Create empty entry for matched user to prevent errors when opening chat
          if (
            data.matched_user_id &&
            !userMessages.value[data.matched_user_id]
          ) {
            userMessages.value[data.matched_user_id] = {
              messages: [],
              unread: 0,
            };
          }
        } else if (
          data.type === "message_sent" ||
          data.type === "message_delivered"
        ) {
          const toUserId = parseInt(data.to);
          const clientMsgId = data.client_msg_id;
          const timestamp = data.timestamp;

          // Get chat data for the recipient user
          const chatData = userMessages.value[toUserId];
          if (chatData && chatData.messages) {
            // Find message by client_msg_id and update it
            const messageIndex = chatData.messages.findIndex(
              (msg) => msg.client_msg_id === clientMsgId
            );
            if (messageIndex !== -1) {
              if (data.type === "message_sent") {
                chatData.messages[messageIndex].timestamp = timestamp;
              } else if (data.type === "message_delivered") {
                chatData.messages[messageIndex].delivered_timestamp = timestamp;
              }
              chatData.messages[messageIndex].status =
                data.type === "message_sent" ? "sent" : "delivered";
              console.log(
                "Message status updated to sent:",
                chatData.messages[messageIndex]
              );
            }
          }
        } else if (data.type === "message_received") {
          const message: Message = {
            client_msg_id: data.client_msg_id,
            from: data.from,
            to: data.to,
            content: data.content,
            timestamp: data.timestamp,
            status: "received",
            conversation_id: data.conversation_id || null,
            delivered_timestamp: null,
            read_timestamp: null,
          };

          // Add the message to the user's messages
          addUserMessage(parseInt(data.from), message);

          if (openedChat.value === parseInt(data.from)) {
            // Increment unread count if chat is not open
            ws.value?.send(
              JSON.stringify({
                type: "read_client",
                userId: parseInt(data.to),
                touserId: parseInt(data.from),
                client_msg_id: message.client_msg_id,
                timestamp: new Date().toISOString(),
              })
            );
          }

          console.log("Message received and added:", message);
        } else if (data.type === "delivery") {
          // Add to queue for processing
          statusUpdateQueue.value.push(data);
          processStatusQueue();
        } else if (data.type === "read") {
          // Add to queue for processing
          statusUpdateQueue.value.push(data);
          processStatusQueue();
        }
      } catch (err) {
        console.error("Invalid message format from server:", event.data);
      }
    };

    ws.value.onerror = (error) => {
      console.error("WebSocket error:", error);
      cleanup();
    };

    ws.value.onclose = () => {
      console.log("❌ WebSocket closed");
      cleanup();
      scheduleReconnect(userId);
    };
  };

  const startPing = () => {
    if (pingInterval.value) clearInterval(pingInterval.value);
    pingInterval.value = setInterval(() => {
      if (ws.value?.readyState === WebSocket.OPEN) {
        ws.value.send(JSON.stringify({ type: "ping" }));
      }
    }, 10000); // every 10 seconds
  };

  const cleanup = () => {
    if (pingInterval.value) clearInterval(pingInterval.value);
    pingInterval.value = null;

    if (ws.value) {
      ws.value.close();
      ws.value = null;
    }
  };

  const scheduleReconnect = (userId: number | undefined) => {
    if (reconnectTimeout.value) clearTimeout(reconnectTimeout.value);
    reconnectTimeout.value = setTimeout(() => {
      console.log("🔁 Reconnecting WebSocket...");
      connectWebSocket(userId);
    }, 3000); // 3 second delay
  };

  const getUserMessages = (userId: number) => {
    return userMessages.value[userId]?.messages || [];
  };

  const addUserMessage = (userId: number, message: Message) => {
    if (!userMessages.value[userId]) {
      userMessages.value[userId] = {
        messages: [],
        unread: 0,
      };
    }

    const messages = userMessages.value[userId].messages;
    const messageTime = new Date(message.timestamp).getTime();

    // Optimize for the common case: most messages arrive in order
    if (
      messages.length === 0 ||
      messageTime >= new Date(messages[messages.length - 1].timestamp).getTime()
    ) {
      // O(1) - Just append to end (most common case)
      messages.push(message);

      // Increment unread count if it's a received message
      if (message.status === "received" && openedChat.value !== userId) {
        userMessages.value[userId].unread =
          (userMessages.value[userId].unread || 0) + 1;
      }
      return;
    }

    // O(log n) - Only use binary search for out-of-order messages
    let left = 0;
    let right = messages.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const midTime = new Date(messages[mid].timestamp).getTime();

      if (midTime <= messageTime) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    // Insert at the correct position
    messages.splice(left, 0, message);

    // Increment unread count if it's a received message
    if (message.status === "received") {
      userMessages.value[userId].unread =
        (userMessages.value[userId].unread || 0) + 1;
    }
  };

  const loadUserMessages = async (userId: number) => {
    const getChats = async () => {
      const response = await fetch(`/api/chat/getmessages/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user messages");
      return response.json();
    };

    try {
      const messages = await getChats();
      // Convert old format to new format if needed
      userMessages.value = Object.keys(messages).reduce((acc, key) => {
        const numKey = parseInt(key);
        if (Array.isArray(messages[numKey])) {
          // Old format: convert array to ChatData
          acc[numKey] = {
            messages: messages[numKey],
            unread: 0, // Initialize unread count to default 0
          };
        } else {
          // New format: already ChatData, ensure unread has default value
          acc[numKey] = {
            ...messages[numKey],
            unread: messages[numKey].unread || 0, // Default to 0 if undefined
          };
        }
        return acc;
      }, {} as Record<number, ChatData>);
    } catch (error) {
      console.error("Error loading user messages:", error);
    }
  };

  const getUnreadCount = (userId: number): number => {
    return userMessages.value[userId]?.unread || 0;
  };

  const markMessagesAsRead = (userId: number) => {
    if (userMessages.value[userId]) {
      userMessages.value[userId].unread = 0;
    }
  };

  const getTotalUnreadCount = (): number => {
    return Object.values(userMessages.value).reduce((total, chatData) => {
      return total + (chatData.unread || 0);
    }, 0);
  };

  const getLastMessageContent = (userId: number): string => {
    const chatData = userMessages.value[userId];
    if (!chatData || !chatData.messages || chatData.messages.length === 0) {
      return "No messages yet";
    }
    const lastMessage = chatData.messages[chatData.messages.length - 1];
    return lastMessage.content || "No content";
  };

  return {
    ws,
    userStatus,
    userMessages,
    openedChat,
    connectWebSocket,
    getUserMessages,
    addUserMessage,
    loadUserMessages,
    getUnreadCount,
    markMessagesAsRead,
    getTotalUnreadCount,
    getLastMessageContent,
    resetOpenedChat,
    setOpenedChat,
  };
});
