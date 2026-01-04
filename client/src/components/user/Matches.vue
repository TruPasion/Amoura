<template>
  <!-- Simple Matches Header -->
  <div class="mb-3">
    <div class="flex items-center justify-between py-2 px-3">
      <div v-if="!props.isCollapsed" class="flex items-center gap-2">
        <div class="text-red-400 text-sm">💕</div>
        <span class="text-2xl font-pacifico text-purple-700">Matches</span>
      </div>
      <div v-else class="flex items-center gap-1">
        <div class="text-red-400 text-xs">💕</div>
      </div>

      <!-- Count on the right -->
      <div
        class="bg-pink-100 text-pink-700 text-xs rounded-full flex items-center justify-center"
        :class="props.isCollapsed ? 'w-5 h-5' : 'w-8 h-8'"
      >
        {{ matches.length }}
      </div>
    </div>
  </div>

  <template v-if="matches.length">
    <ul>
      <li
        v-for="match in matches"
        :key="match.user_id"
        :class="[
          'bg-white shadow-md rounded-lg p-4 mb-4 hover:shadow-lg transition-shadow duration-300 border cursor-pointer relative group',
          chatUser?.user_id === match.user_id
            ? 'border-blue-600 ring-2 ring-blue-400'
            : 'border-gray-300',
        ]"
        @click="openChat(match)"
        style="margin: 0.5rem; padding: 1rem"
      >
        <!-- Delete Button - appears on hover -->
        <button
          v-if="!props.isCollapsed"
          @click.stop="confirmDeleteMatch(match)"
          class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center z-10"
          type="button"
          title="Remove match"
        >
          <Trash2 class="w-4 h-4" />
        </button>

        <div
          :class="
            props.isCollapsed
              ? 'flex items-center justify-center mt-3'
              : 'flex items-center gap-4'
          "
        >
          <div class="w-12 h-12">
            <GcpAvatar
              bordered
              :src="match.profile_photo"
              avatar-class="rounded-full"
            />
          </div>
          <div v-if="!props.isCollapsed" class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <div class="flex-1 min-w-0">
                <h1 class="text-lg font-semibold text-gray-800 truncate">
                  {{ match.full_name }}
                </h1>
                <p class="text-sm text-gray-500 truncate">
                  {{ getLastMessageContent(match.user_id) }}
                </p>
              </div>
              <div class="flex flex-col items-end gap-1 flex-shrink-0">
                <div
                  v-if="getUnreadCount(match.user_id) > 0"
                  class="bg-green-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-medium"
                >
                  {{ getUnreadCount(match.user_id) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </template>

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
          Remove Match?
        </h3>
        <p class="text-gray-600 text-center text-sm leading-relaxed">
          Are you sure you want to remove
          <strong>{{ matchToDelete?.full_name }}</strong> from your matches?
          This action cannot be undone.
        </p>
      </div>

      <!-- Dialog Actions -->
      <div class="px-6 pb-6">
        <div class="flex flex-col gap-3">
          <!-- Remove Button -->
          <button
            @click="handleDeleteMatch"
            :disabled="isDeleting"
            class="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <Trash2 class="w-5 h-5" v-if="!isDeleting" />
            <div
              class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
              v-else
            />
            {{ isDeleting ? "Removing..." : "Yes, Remove Match" }}
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

<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import GcpAvatar from "../common/GcpAvatar.vue";
import { Trash2, AlertTriangle } from "lucide-vue-next";
import { useUserStore } from "../../stores/user";
import { storeToRefs } from "pinia";
import { useActionStore } from "../../stores/actionStore";
import { useChatStore } from "../../stores/chatStore";
import type { Match } from "../../utils/types";

const userStore = useUserStore();
const actionStore = useActionStore();
const chatStore = useChatStore();
const { getMatches, openChat, removeMatch } = actionStore;
const { user } = storeToRefs(userStore);

const props = defineProps<{
  isCollapsed: boolean;
}>();

const { matches, chatUser } = storeToRefs(actionStore);
const { userMessages } = storeToRefs(chatStore);
const { sendResetMatchToUsers } = chatStore;

// Delete dialog state
const showDeleteDialog = ref(false);
const matchToDelete = ref<Match | null>(null);
const isDeleting = ref(false);

// Computed helpers for reactivity
const getUnreadCount = computed(() => (userId: number) => {
  return userMessages.value[userId]?.unread || 0;
});

const getLastMessageContent = computed(() => (userId: number) => {
  const chatData = userMessages.value[userId];
  if (!chatData || !chatData.messages || chatData.messages.length === 0) {
    return "No messages yet";
  }
  const lastMessage = chatData.messages[chatData.messages.length - 1];
  return lastMessage.content || "No content";
});

// Delete match functions
const confirmDeleteMatch = (match: Match) => {
  console.log("confirmDeleteMatch called with:", match);
  matchToDelete.value = match;
  showDeleteDialog.value = true;
};

const handleDeleteMatch = async () => {
  if (!matchToDelete.value) return;

  isDeleting.value = true;
  const matchId = matchToDelete.value.user_id;
  try {
    // Call the empty function as requested, passing the user ID
    await deleteMatchFunction(matchToDelete.value.user_id);

    // Remove from local state
    removeMatch(matchToDelete.value.user_id);

    // Close dialog
    showDeleteDialog.value = false;
    matchToDelete.value = null;
  } catch (error) {
    console.error("Failed to delete match:", error);
  } finally {
    isDeleting.value = false;
    //send some websocket event to notify other user?
    sendResetMatchToUsers([matchId]);
  }
};

// API call to unmatch user endpoint
const deleteMatchFunction = async (userId: number) => {
  try {
    const response = await fetch("/api/actions/unmatchuser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for authentication
      body: JSON.stringify({
        userId: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Match deleted successfully:", result);
    return result;
  } catch (error) {
    console.error("Error calling unmatch API:", error);
    throw error;
  }
};

onMounted(async () => {
  if (user.value && user.value.id) {
    await getMatches(user.value.id);
  }
});
</script>
