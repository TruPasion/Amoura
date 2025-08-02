import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useUserStore } from "./user";
import { useActionStore } from "./actionStore";
import type { UserStatus } from "../utils/types";

export const useChatStore = defineStore("chat", () => {
  const ws = ref<WebSocket | null>(null);
  const messages = ref<string[]>([]);
  const actionStore = useActionStore();
  const userStatus = ref<UserStatus | null>(null);
  const { chatUser } = storeToRefs(actionStore);

  const connectWebSocket = (userId: number | undefined) => {
    const userStore = useUserStore();
    ws.value = new WebSocket("ws://localhost:8000/ws");

    ws.value.onopen = () => {
      if (userId !== undefined) {
        const payload = JSON.stringify({ user_id: userId });
        ws.value?.send(payload);
      }
    };

    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);

        // Print the message content
        if (data) {
          console.log("Message content:", data);
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
          // Show match toast
          userStore.setMessage(
            data.message || "You have a new match!",
            "success",
            5000
          );
        }

        messages.value.push(event.data); // Optional, for logs/debug
      } catch (err) {
        console.error("Invalid message format from server:", event.data);
      }
    };

    ws.value.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.value.onclose = () => {
      console.log("WebSocket connection closed");
    };
  };

  return {
    ws,
    messages,
    userStatus,
    connectWebSocket,
  };
});
