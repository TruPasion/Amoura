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
      <div class="flex-1 bg-white p-4 overflow-y-auto" ref="messagesContainer">
        <div v-if="messages.length === 0" class="text-center text-gray-500">
          Start chatting with {{ props.chatUser.full_name }}!
        </div>

        <!-- Messages grouped by date -->
        <div v-for="group in groupedMessages" :key="group.date">
          <!-- Date separator -->
          <div class="flex items-center justify-center my-4">
            <div class="flex-grow border-t border-gray-300"></div>
            <span
              class="mx-4 text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-300"
            >
              {{ group.date }}
            </span>
            <div class="flex-grow border-t border-gray-300"></div>
          </div>

          <!-- Messages for this date -->
          <div
            v-for="message in group.messages"
            :key="message.client_msg_id"
            class="mb-4"
          >
            <div
              :class="
                message.from === user?.id?.toString()
                  ? 'flex justify-end'
                  : 'flex justify-start'
              "
            >
              <div
                :class="
                  message.from === user?.id?.toString()
                    ? 'bg-blue-500 text-white max-w-xs lg:max-w-md px-4 py-2 rounded-lg'
                    : 'bg-gray-200 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg'
                "
              >
                <p class="text-sm">{{ message.content }}</p>
                <div
                  v-if="message.status !== 'sending'"
                  class="flex items-center justify-between mt-1"
                >
                  <span class="text-xs opacity-70">{{
                    formatMessageTime(message.timestamp)
                  }}</span>
                  <div
                    v-if="message.from === user?.id?.toString()"
                    class="flex items-center ml-2"
                  >
                    <!-- Single tick (sent) -->
                    <span
                      v-if="message.status === 'sent'"
                      class="text-xs opacity-70"
                      >✓</span
                    >
                    <!-- Double tick (delivered) -->
                    <span
                      v-else-if="message.status === 'delivered'"
                      class="text-xs opacity-70"
                      >✓✓</span
                    >
                    <!-- Double tick blue (read) -->
                    <span
                      v-else-if="message.status === 'read'"
                      class="text-xs text-green-400"
                      >✓✓</span
                    >
                    <!-- Failed status -->
                    <span
                      v-else-if="message.status === 'failed'"
                      class="text-xs text-red-500"
                      >⚠</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Input Area -->
      <div
        class="flex items-center bg-gradient-to-r from-gray-100 to-gray-200 p-4 border-t border-gray-300 rounded-b-lg"
      >
        <textarea
          v-model="messageInput"
          @keydown.enter.prevent="sendMessage"
          class="flex-1 resize-none border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="1"
          placeholder="Type a message..."
        ></textarea>
        <button
          @click="sendMessage"
          :disabled="!messageInput.trim()"
          class="ml-3 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
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
import type { Match, Message } from "../../utils/types";
import {
  formatMessageTimeIST,
  formatLastSeenIST,
  formatMessageDateIST,
} from "../../utils/types";
import { onMounted, onUnmounted, ref, computed, nextTick, watch } from "vue";
import { nanoid } from "nanoid";

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

// Message related refs
const messageInput = ref("");
const messages = computed(() => {
  const userId = props.chatUser.user_id;
  if (!userId || !props.chatUser) return [];
  return chatStore.getUserMessages(props.chatUser.user_id);
});

// Watch for new messages and auto-scroll to bottom
watch(
  () => messages.value.length,
  (newLength, oldLength) => {
    // Only scroll if new messages were added (not on initial load)
    if (oldLength !== undefined && newLength > oldLength) {
      nextTick(() => {
        scrollToBottom();
      });
    }
  },
  { immediate: false }
);

// Group messages by date
const groupedMessages = computed(() => {
  const groups: { [date: string]: Message[] } = {};

  messages.value.forEach((message) => {
    const dateKey = formatMessageDateIST(message.timestamp);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
  });

  // Convert to array and sort by date
  return Object.entries(groups)
    .map(([date, msgs]) => ({
      date,
      messages: msgs,
    }))
    .sort((a, b) => {
      // Sort by the first message timestamp in each group
      const aTime = new Date(a.messages[0]?.timestamp || 0).getTime();
      const bTime = new Date(b.messages[0]?.timestamp || 0).getTime();
      return aTime - bTime;
    });
});

const messagesContainer = ref<HTMLElement | null>(null);

// Reactive timer for updating last seen
const lastSeenTimer = ref<number | null>(null);
const currentTime = ref(new Date());

// Function to format message timestamp in IST
const formatMessageTime = (timestamp: string) => {
  return formatMessageTimeIST(timestamp);
};

// Function to send message
const sendMessage = () => {
  if (!messageInput.value.trim() || !ws.value || !user.value) return;

  const clientMsgId = nanoid();
  const message: Message = {
    client_msg_id: clientMsgId,
    from: user.value.id.toString(),
    to: props.chatUser.user_id.toString(),
    content: messageInput.value.trim(),
    timestamp: new Date().toISOString(),
    status: "sending",
    conversation_id: null,
    delivered_timestamp: null,
    read_timestamp: null,
  };

  // Add message to local state
  chatStore.addUserMessage(props.chatUser.user_id, message);

  // Send message to WebSocket server
  const wsMessage = {
    type: "message_sending",
    to: props.chatUser.user_id.toString(),
    content: messageInput.value.trim(),
    client_msg_id: clientMsgId,
  };

  //console.log("Sending message via WebSocket:", wsMessage);

  ws.value.send(JSON.stringify(wsMessage));

  // Clear input
  messageInput.value = "";

  // Scroll to bottom
  scrollToBottom();
};

// Function to scroll messages to bottom
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// Function to format last seen time in IST
const formatLastSeen = (lastSeen: string) => {
  //console.log("Formatting last seen time:", lastSeen);
  return formatLastSeenIST(lastSeen);
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

  chatStore.setOpenedChat(props.chatUser.user_id);

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
  scrollToBottom();
});

onUnmounted(() => {
  stopLastSeenTimer();
  chatStore.resetOpenedChat();
  //console.log("Cleaning up userChat component");
});
</script>

<style scoped>
/* Add any additional styling if needed */
</style>
