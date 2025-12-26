<script setup lang="ts">
import { FwbAvatar } from "flowbite-vue";
import { useUserStore } from "../../stores/user";
import { useActionStore } from "../../stores/actionStore";
import Matches from "../user/Matches.vue";
import { Search } from "lucide-vue-next";
import { storeToRefs } from "pinia";
import { computed } from "vue";

const userStore = useUserStore();
const actionStore = useActionStore();
const { openProfile, chatUser } = storeToRefs(actionStore);

const props = defineProps<{
  isCollapsed: boolean;
}>();

const openUserProfile = () => {
  actionStore.openUserProfile();
};

const openFeed = () => {
  // Only open feed if we're not already on it
  const isOnFeed = !openProfile.value && !chatUser.value?.user_id;
  if (!isOnFeed) {
    actionStore.openFeed();
  }
};

// Computed property to check if feed is currently displayed
const isOnFeed = computed(() => {
  return !openProfile.value && !chatUser.value?.user_id;
});
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- User Profile - Top Fixed -->
    <div class="flex-none">
      <div class="header m-1">
        <div>
          <div
            :class="
              props.isCollapsed
                ? 'flex items-center justify-center mt-3 bg-gradient-to-r from-gray-50 to-gray-100 shadow-lg rounded-lg p-3 border border-gray-200 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-all duration-200'
                : 'flex items-center gap-2 m-3 bg-gradient-to-r from-gray-50 to-gray-100 shadow-lg rounded-lg p-3 border border-gray-200 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-all duration-200'
            "
            @click="openUserProfile"
          >
            <div class="w-12 h-12">
              <fwb-avatar
                bordered
                :img="userStore.user?.profile?.profile_photo?.image_url"
                class="rounded-full"
              />
            </div>
            <div v-if="!props.isCollapsed" class="m-1.5">
              <h1 class="text-lg font-semibold text-gray-700">
                {{ userStore.user?.profile?.full_name }}
              </h1>
            </div>
          </div>
        </div>
      </div>
      <!-- Horizontal separator after profile -->
      <div class="px-3 mb-2">
        <div
          class="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"
        ></div>
      </div>
    </div>

    <!-- Matches - Middle Scrollable Area -->
    <div class="flex-1 overflow-y-auto">
      <div class="font-serif w-full flex flex-col flex-center">
        <Matches :is-collapsed="props.isCollapsed" />
      </div>
    </div>

    <!-- Horizontal separator before Find New Matches -->
    <div v-if="!isOnFeed" class="flex-none px-3 mb-2">
      <div
        class="w-full h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent"
      ></div>
    </div>

    <!-- Find Matches Button - Bottom Fixed -->
    <div v-if="!isOnFeed" class="flex-none p-3">
      <button
        @click="openFeed"
        :class="
          props.isCollapsed
            ? 'flex items-center justify-center w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105'
            : 'flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105'
        "
        title="Find New Matches"
      >
        <Search class="w-5 h-5" />
        <span v-if="!props.isCollapsed" class="text-sm font-medium"
          >Find New Matches</span
        >
      </button>
    </div>
  </div>
</template>
