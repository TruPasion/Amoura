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
          <GcpAvatar
            bordered
            :src="props.chatUser.profile_photo"
            avatar-class="w-10 h-10 rounded-full"
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
        <div class="flex items-center gap-2">
          <button
            @click="showDeleteDialog = true"
            class="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all duration-200"
          >
            <Trash2 class="w-5 h-5" />
          </button>
          <button
            @click="closeChat"
            class="text-gray-500 hover:text-gray-800 p-2 rounded-full transition-all duration-200"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
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
                  <span
                    v-if="message.status !== 'failed'"
                    class="text-xs opacity-70"
                    >{{ formatMessageTime(message.timestamp) }}</span
                  >
                  <div
                    v-if="message.from === user?.id?.toString()"
                    class="flex items-center ml-2"
                  >
                    <!-- Failed status: show AlertTriangle icon with tooltip, no ticks for failed -->
                    <span
                      v-if="message.status === 'failed'"
                      class="relative group cursor-pointer flex items-center"
                    >
                      <AlertTriangle class="w-4 h-4 text-red-500" />
                      <span
                        class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 max-w-[180px] break-words bg-white border border-red-400 text-red-600 text-xs rounded px-2 py-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50"
                      >
                        User not found
                      </span>
                    </span>
                    <!-- Single tick (sent) -->
                    <span
                      v-else-if="message.status === 'sent'"
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Input Area -->
      <div
        class="flex flex-col bg-gradient-to-r from-gray-100 to-gray-200 p-4 border-t border-gray-300 rounded-b-lg"
      >
        <!-- Character Counter -->
        <div class="flex justify-end mb-2">
          <span
            :class="
              messageInput.length > CHARACTER_LIMIT
                ? 'text-red-500'
                : 'text-gray-500'
            "
            class="text-xs"
          >
            {{ messageInput.length }}/{{ CHARACTER_LIMIT }}
          </span>
        </div>

        <div class="flex items-center">
          <textarea
            v-model="messageInput"
            @keydown.enter.prevent="sendMessage"
            class="flex-1 resize-none border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="
              messageInput.length > CHARACTER_LIMIT
                ? 'border-red-300 focus:ring-red-500'
                : ''
            "
            rows="1"
            placeholder="Type a message..."
            :maxlength="CHARACTER_LIMIT"
          ></textarea>
          <button
            @click="sendMessage"
            :disabled="!canSendMessage"
            class="ml-3 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>

        <!-- Error message for character limit -->
        <div
          v-if="messageInput.length > CHARACTER_LIMIT"
          class="text-red-500 text-xs mt-1"
        >
          Message is too long. Please shorten your message.
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div
      v-if="showDeleteDialog"
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="showDeleteDialog = false"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ease-out scale-100"
      >
        <!-- Dialog Header -->
        <div class="p-6 pb-4">
          <div class="flex items-center justify-center mb-4">
            <div
              class="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center"
            >
              <AlertTriangle class="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 class="text-xl font-bold text-gray-900 text-center mb-2">
            Delete Conversation?
          </h3>
          <p class="text-gray-600 text-center text-sm leading-relaxed">
            This will permanently delete your conversation with
            <strong>{{ props.chatUser.full_name }}</strong
            >. Messages will be deleted on both sides and cannot be recovered.
          </p>
        </div>

        <!-- Dialog Actions -->
        <div class="px-6 pb-6">
          <div class="flex flex-col gap-3">
            <!-- Delete Button -->
            <button
              @click="confirmDeleteChat"
              :disabled="isDeleting"
              class="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <Trash2 class="w-5 h-5" v-if="!isDeleting" />
              <div
                class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                v-else
              />
              {{ isDeleting ? "Deleting..." : "Delete Conversation" }}
            </button>

            <!-- Cancel Button -->
            <button
              @click="showDeleteDialog = false"
              :disabled="isDeleting"
              class="w-full text-gray-500 hover:text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useActionStore } from "../../stores/actionStore";
import GcpAvatar from "../common/GcpAvatar.vue";
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
import { X, Trash2, AlertTriangle } from "lucide-vue-next";

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
const showDeleteDialog = ref(false);
const isDeleting = ref(false);

// Character limit constant
const CHARACTER_LIMIT = 200;

// Computed property to check if message can be sent
const canSendMessage = computed(() => {
  return (
    messageInput.value.trim() && messageInput.value.length <= CHARACTER_LIMIT
  );
});

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

// Delete chat functions
const confirmDeleteChat = async () => {
  if (isDeleting.value) return;

  isDeleting.value = true;
  try {
    // Call the delete conversation endpoint with openedChat as query param
    await chatStore.deleteConversation(props.chatUser.user_id);

    // Send WebSocket message to notify the other user with custom message
    if (ws.value && user.value) {
      const currentUserName = user.value.profile?.full_name || "User";
      const customMessage = `Your conversation with ${currentUserName} has been deleted by ${currentUserName}`;

      const wsMessage = {
        type: "delete_conversation",
        to: props.chatUser.user_id.toString(),
        message: customMessage,
        deletedBy: currentUserName,
      };
      ws.value.send(JSON.stringify(wsMessage));
      console.log(
        "Sent delete conversation notification to user:",
        props.chatUser.user_id
      );
    }
    showDeleteDialog.value = false;
  } catch (error) {
    console.error("Failed to delete chat:", error);
    // You can show an error toast here if needed
  } finally {
    isDeleting.value = false;
  }

  // Send a message to record who deleted the conversation
  if (ws.value && user.value) {
    messageInput.value = `Conversation deleted by ${user.value.profile?.full_name}`;
    sendMessage();
    messageInput.value = "";
    scrollToBottom();
  }
};

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
