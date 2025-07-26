<template>
  <div class="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
    <h1 class="text-xl font-bold text-center">WebSocket Test Chat</h1>
    <div class="flex space-x-2">
      <input
        v-model="message"
        placeholder="Type a message"
        class="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        @click="sendMessage"
        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Send
      </button>
    </div>
    <div>
      <h2 class="text-lg font-semibold">Messages:</h2>
      <ul class="space-y-2">
        <li
          v-for="(msg, index) in messages"
          :key="index"
          class="p-2 bg-gray-100 rounded-md"
        >
          {{ msg }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useUserStore } from "../../stores/user";
import { storeToRefs } from "pinia";

const userStore = useUserStore();
const { user } = storeToRefs(userStore);


const ws = ref<WebSocket | null>(null);
const message = ref("");
const messages = ref<string[]>([]);

const connectWebSocket = (userId: number | undefined) => {
  ws.value = new WebSocket("ws://localhost:8000/ws");

  ws.value.onopen = () => {
    if (userId !== undefined) {
      const payload = JSON.stringify({ user_id: userId });
      ws.value?.send(payload);
    }
  };

  ws.value.onmessage = (event) => {
    messages.value.push(event.data);
  };

  ws.value.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  ws.value.onclose = () => {
    console.log("WebSocket connection closed");
  };
};

const sendMessage = () => {
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    ws.value.send(message.value);
    message.value = "";
  } else {
    console.error("WebSocket is not connected");
  }
};

onMounted(() => {
  connectWebSocket(user.value?.id);
});

onBeforeUnmount(() => {
  if (ws.value) {
    ws.value.close();
  }
});
</script>

<style scoped>
/* Tailwind CSS is used for styling */
</style>