<template>
  <template v-if="props.chatUser?.user_id">
    <div
      class="flex flex-col h-full bg-gray-50 shadow-lg rounded-lg border border-gray-200"
    >
      <!-- Chat Top Bar -->
      <div
        class="flex items-center justify-between bg-gradient-to-r from-gray-100 to-gray-200 p-4 border-b border-gray-300 rounded-t-lg"
      >
        <div class="flex items-center gap-3">
          <fwb-avatar
            bordered
            :img="props.chatUser.profile_photo"
            class="w-10 h-10 rounded-full"
          />
          <div>
            <h1 class="text-lg font-semibold text-gray-800">
              {{ props.chatUser.full_name }}
            </h1>
            <p class="text-sm text-gray-500">
              {{ formattedLastSeen }}
            </p>
          </div>
        </div>
        <button @click="closeChat" class="text-gray-500 hover:text-gray-800">
          ✖
        </button>
      </div>

      <!-- Chat Messages Area -->
      <div class="flex-1 bg-white p-4 overflow-y-auto">
        <!-- Messages will go here -->
        <p class="text-center text-gray-500">
          Start chatting with {{ props.chatUser.full_name }}!
        </p>
      </div>

      <!-- Chat Input Area -->
      <div
        class="flex items-center bg-gradient-to-r from-gray-100 to-gray-200 p-4 border-t border-gray-300 rounded-b-lg"
      >
        <textarea
          class="flex-1 resize-none border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="1"
          placeholder="Type a message..."
        ></textarea>
        <button
          class="ml-3 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Send
        </button>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useActionStore } from "../../stores/actionStore";
import { FwbAvatar } from "flowbite-vue";
import type { Match } from "../../utils/types";
import { onMounted, onUnmounted, ref, computed } from "vue";

import { useChatStore } from "../../stores/chatStore";
import { useUserStore } from "../../stores/user";

import { storeToRefs } from "pinia";

const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const chatStore = useChatStore();
const { ws, userStatus } = storeToRefs(chatStore);

const props = defineProps<{
  chatUser: Match;
}>();

const actionStore = useActionStore();
const { closeChat } = actionStore;

// Reactive timer for updating last seen
const lastSeenTimer = ref<number | null>(null);
const currentTime = ref(new Date());

// Function to format last seen time
const formatLastSeen = (lastSeen: string) => {
  // Parse UTC timestamp from database (backend stores in UTC)
  const utcDate = new Date(lastSeen + "Z"); // Ensure it's treated as UTC

  // Get current time (browser automatically handles local timezone)
  const now = currentTime.value;

  // Convert UTC timestamp to user's local timezone
  const localLastSeen = new Date(utcDate.getTime());

  const diffInMinutes = Math.floor(
    (now.getTime() - localLastSeen.getTime()) / (1000 * 60)
  );

  // Get user's timezone for logging
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  console.log("User timezone:", userTimezone);
  console.log("UTC Last Seen:", utcDate.toISOString());
  console.log("Local Last Seen:", localLastSeen.toLocaleString());
  console.log("Current Time:", now.toLocaleString());
  console.log("Diff in minutes:", diffInMinutes);

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}d ago`;
  }
};

// Function to start the timer
const startLastSeenTimer = () => {
  // Clear existing timer if any
  if (lastSeenTimer.value) {
    clearInterval(lastSeenTimer.value);
  }

  // Update time every minute (60000ms)
  lastSeenTimer.value = setInterval(() => {
    currentTime.value = new Date();
  }, 60000);
};

// Function to stop the timer
const stopLastSeenTimer = () => {
  if (lastSeenTimer.value) {
    clearInterval(lastSeenTimer.value);
    lastSeenTimer.value = null;
  }
};

const formattedLastSeen = computed(() => {
  if (userStatus.value?.status === "online") {
    return "Online";
  } else if (userStatus.value?.last_seen) {
    return formatLastSeen(userStatus.value.last_seen);
  } else {
    return "Offline";
  }
});

onMounted(() => {
  // Send get_status message to server when component mounts
  if (ws.value && user.value && props.chatUser) {
    const statusMessage = {
      from: user.value.id,
      to: props.chatUser.user_id,
      type: "onboard",
    };

    ws.value.send(JSON.stringify(statusMessage));
  }

  // Start the timer for updating last seen
  startLastSeenTimer();
});

onUnmounted(() => {
  // Clean up timer when component is destroyed
  stopLastSeenTimer();
});
</script>

<style scoped>
/* Add any additional styling if needed */
</style>
