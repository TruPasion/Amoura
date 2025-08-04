import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useUserStore } from "./user";
import { useActionStore } from "./actionStore";
import type { UserStatus } from "../utils/types";

export const useChatStore = defineStore("chat", () => {
  const ws = ref<WebSocket | null>(null);
  const pingInterval = ref<number | null>(null);
  const reconnectTimeout = ref<number | null>(null);

  const messages = ref<string[]>([]);
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
        }

        if (data.type === "onboard_response" || data.type === "status_update") {
          if (chatUser.value?.user_id === data.data.user_id) {
            userStatus.value = {
              user_id: data.data.user_id,
              status: data.data.status,
              last_seen: data.data.last_seen,
            };
            console.log("User status updated:", userStatus.value);
          }
        }

        if (data.type === "match") {
          userStore.setMessage(
            data.message || "You have a new match!",
            "success",
            5000
          );
        }

        messages.value.push(event.data);
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

  return {
    ws,
    messages,
    userStatus,
    connectWebSocket,
  };
});
