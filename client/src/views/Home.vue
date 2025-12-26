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

    <!-- Navigation Confirmation Dialog -->
    <div
      v-if="showNavigationConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="cancelNavigation"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ease-out scale-100"
      >
        <!-- Dialog Header -->
        <div class="p-6 pb-4">
          <div class="flex items-center justify-center mb-4">
            <div
              class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
            >
              <AlertTriangle class="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 class="text-xl font-bold text-gray-900 text-center mb-2">
            Leave Without Saving?
          </h3>
          <p class="text-gray-600 text-center text-sm leading-relaxed">
            You have unsaved changes to your profile photos. What would you like
            to do?
          </p>
        </div>

        <!-- Dialog Actions -->
        <div class="px-6 pb-6">
          <div class="flex flex-col gap-3">
            <!-- Save and Continue Button -->
            <button
              @click="saveAndNavigate"
              :disabled="isSavingNavigation"
              class="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <Save class="w-5 h-5" v-if="!isSavingNavigation" />
              <Loader2 class="w-5 h-5 animate-spin" v-else />
              {{ isSavingNavigation ? "Saving..." : "Save & Continue" }}
            </button>

            <!-- Discard and Continue Button -->
            <button
              @click="discardAndNavigate"
              :disabled="isSavingNavigation"
              class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trash2 class="w-5 h-5" />
              Discard & Continue
            </button>

            <!-- Cancel Button -->
            <button
              @click="cancelNavigation"
              :disabled="isSavingNavigation"
              class="w-full text-gray-500 hover:text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
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
import { useUserStore } from "../stores/user";
import { useChatStore } from "../stores/chatStore";
import { storeToRefs } from "pinia";
import { AlertTriangle, Save, Trash2, Loader2 } from "lucide-vue-next";

const actionStore = useActionStore();
const userStore = useUserStore();
const chatStore = useChatStore();
const { chatUser, openProfile, showNavigationConfirm } =
  storeToRefs(actionStore);
const { user } = storeToRefs(userStore);
const { ws } = storeToRefs(chatStore);

const isSavingNavigation = ref(false);

// Navigation confirmation methods
const saveAndNavigate = async () => {
  isSavingNavigation.value = true;
  try {
    // Save the profile changes
    const delta = userStore.saveProfileChanges();
    console.log("Saving before navigation:", delta);

    // Update original data and reset changes
    userStore.updateOriginalData();
    userStore.resetChanges();

    console.log("✅ Profile saved successfully before navigation!");

    // Proceed with navigation
    actionStore.confirmNavigation();
  } catch (error) {
    console.error("❌ Failed to save profile before navigation:", error);
  } finally {
    isSavingNavigation.value = false;
  }
};

const discardAndNavigate = () => {
  actionStore.discardAndNavigate();
};

const cancelNavigation = () => {
  actionStore.cancelNavigation();
};

const isHovered = ref(false);
const screenWidth = ref(
  typeof window !== "undefined" ? window.innerWidth : 1024
);

const updateScreenWidth = () => {
  screenWidth.value = window.innerWidth;
};

onMounted(async () => {
  window.addEventListener("resize", updateScreenWidth);
  chatStore.connectWebSocket(user.value?.id);
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

onBeforeUnmount(() => {
  if (ws.value) {
    ws.value.close();
  }
});
</script>
