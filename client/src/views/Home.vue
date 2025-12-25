<template>
  <Toaster />
  <div
    class="h-screen w-full flex relative bg-gradient-to-br from-gray-100 to-gray-200"
  >
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
      <template v-if="openProfile">
        <UserProfile />
      </template>
      <template v-else-if="!chatUser?.user_id">
        <Feed />
      </template>
      <template v-else>
        <userChat :chatUser="chatUser" :key="chatUser.user_id" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount } from "vue";
import userChat from "../components/Chat/userChat.vue";
import Sidenav from "../components/Home/Sidenav.vue";
import Feed from "../components/Home/Feed.vue";
import Toaster from "../components/toast/Toaster.vue";
import UserProfile from "../components/user/UserProfile.vue";
import { useActionStore } from "../stores/actionStore";

const { chatUser, openProfile } = storeToRefs(useActionStore());

const isHovered = ref(false);
const screenWidth = ref(
  typeof window !== "undefined" ? window.innerWidth : 1024
);

const updateScreenWidth = () => {
  screenWidth.value = window.innerWidth;
};

onMounted(async () => {
  window.addEventListener("resize", updateScreenWidth);
  if (user.value?.id) {
    await chatStore.loadUserMessages(user.value.id);
  }
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
import { useChatStore } from "../stores/chatStore";
import { storeToRefs } from "pinia";

const userStore = useUserStore();
const chatStore = useChatStore();
const { user } = storeToRefs(userStore);
const { ws } = storeToRefs(chatStore);

// const message = ref("");

// const sendMessage = () => {
//   if (ws.value && ws.value.readyState === WebSocket.OPEN) {
//     ws.value.send(message.value);
//     message.value = "";
//   } else {
//     console.error("WebSocket is not connected");
//   }
// };

onMounted(() => {
  chatStore.connectWebSocket(user.value?.id);
});

onBeforeUnmount(() => {
  if (ws.value) {
    ws.value.close();
  }
});
</script>
