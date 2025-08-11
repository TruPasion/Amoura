import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useUserStore } from "./user";
import { useActionStore } from "./actionStore";
import type { UserStatus } from "../utils/types";
import type { Message } from "../utils/types";

export const useChatStore = defineStore("chat", () => {
  const ws = ref<WebSocket | null>(null);
  const pingInterval = ref<number | null>(null);
  const reconnectTimeout = ref<number | null>(null);

  const userMessages = ref<Record<number, Message[]>>({});

  const userStatus = ref<UserStatus | null>(null);
  const actionStore = useActionStore();
  const { chatUser } = storeToRefs(actionStore);

  const connectWebSocket = (userId: number | undefined) => {
    const userStore = useUserStore();
    ws.value = new WebSocket("ws://localhost:8000/ws");

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
        } else if (
          data.type === "message_sent" ||
          data.type === "message_delivered"
        ) {
          const toUserId = parseInt(data.to);
          const clientMsgId = data.client_msg_id;
          const timestamp = data.timestamp;

          // Get messages array for the recipient user
          const messages = userMessages.value[toUserId];
          if (messages) {
            // Find message by client_msg_id and update it
            const messageIndex = messages.findIndex(
              (msg) => msg.client_msg_id === clientMsgId
            );
            if (messageIndex !== -1) {
              messages[messageIndex].timestamp = timestamp;
              messages[messageIndex].status =
                data.type === "message_sent" ? "sent" : "delivered";
              console.log(
                "Message status updated to sent:",
                messages[messageIndex]
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
          };

          // Add the message to the user's messages
          addUserMessage(parseInt(data.from), message);
          console.log("Message received and added:", message);
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
    return userMessages.value[userId] || [];
  };

  const addUserMessage = (userId: number, message: Message) => {
    if (!userMessages.value[userId]) {
      userMessages.value[userId] = [];
    }

    const messages = userMessages.value[userId];
    const messageTime = new Date(message.timestamp).getTime();

    // Optimize for the common case: most messages arrive in order
    if (
      messages.length === 0 ||
      messageTime >= new Date(messages[messages.length - 1].timestamp).getTime()
    ) {
      // O(1) - Just append to end (most common case)
      messages.push(message);
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
  };

  return {
    ws,
    userStatus,
    userMessages,
    connectWebSocket,
    getUserMessages,
    addUserMessage,
  };
});
