<template>
  <Toaster />
  <div class="h-screen w-full flex relative bg-gradient-to-br from-gray-100 to-gray-200">
    <!-- Sidebar -->
    <div
      :class="[
        'bg-white border-r border-gray-300 transition-all duration-300 ease-in-out z-20 rounded-lg shadow-xl',
        isHovered ? 'fixed top-0 left-0 h-full w-64' : 'relative w-16',
        'lg:relative lg:w-64 lg:z-auto',
      ]"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <Sidenav :is-collapsed="isSidenavCollapsed" />
    </div>

    <!-- Right pane -->
    <div
      class="flex-1 h-full bg-white overflow-auto rounded-lg shadow-lg p-6"
      style="height: 100vh"
    >
      <Feed />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount } from "vue";
import Sidenav from "../components/Home/Sidenav.vue";
import Feed from "../components/Home/Feed.vue";
import Toaster from "../components/toast/Toaster.vue";


const isHovered = ref(false);
const screenWidth = ref(
  typeof window !== "undefined" ? window.innerWidth : 1024
);

const updateScreenWidth = () => {
  screenWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener("resize", updateScreenWidth);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateScreenWidth);
});

// Computed property to know if sidenav is collapsed
// On large screens (>= 1024px), sidenav is always expanded
// On smaller screens, it's collapsed when not hovered
const isSidenavCollapsed = computed(() => {
  const isLargeScreen = screenWidth.value >= 1024; // lg breakpoint
  return !isLargeScreen && !isHovered.value;
});

import { useUserStore } from "../stores/user";
import { storeToRefs } from "pinia";

const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const ws = ref<WebSocket | null>(null);
// const message = ref("");
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
    try {
      const data = JSON.parse(event.data);
      console.log("Received message:", data);

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

// const sendMessage = () => {
//   if (ws.value && ws.value.readyState === WebSocket.OPEN) {
//     ws.value.send(message.value);
//     message.value = "";
//   } else {
//     console.error("WebSocket is not connected");
//   }
// };

onMounted(() => {
  connectWebSocket(user.value?.id);
});

onBeforeUnmount(() => {
  if (ws.value) {
    ws.value.close();
  }
});
</script>
