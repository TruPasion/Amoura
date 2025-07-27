<template>
  <template v-if="chatUser?.user_id">
    <div class="flex flex-col h-full bg-gray-50 shadow-lg rounded-lg border border-gray-200">
      <!-- Chat Top Bar -->
      <div class="flex items-center justify-between bg-gradient-to-r from-gray-100 to-gray-200 p-4 border-b border-gray-300 rounded-t-lg">
        <div class="flex items-center gap-3">
          <fwb-avatar bordered :img="chatUser.profile_photo" class="w-10 h-10 rounded-full" />
          <div>
            <h1 class="text-lg font-semibold text-gray-800">{{ chatUser.full_name }}</h1>
            <p class="text-sm text-gray-500">Online</p>
          </div>
        </div>
        <button @click="closeChat" class="text-gray-500 hover:text-gray-800">
          ✖
        </button>
      </div>

      <!-- Chat Messages Area -->
      <div class="flex-1 bg-white p-4 overflow-y-auto">
        <!-- Messages will go here -->
        <p class="text-center text-gray-500">Start chatting with {{ chatUser.full_name }}!</p>
      </div>

      <!-- Chat Input Area -->
      <div class="flex items-center bg-gradient-to-r from-gray-100 to-gray-200 p-4 border-t border-gray-300 rounded-b-lg">
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
import { useActionStore } from '../../stores/actionStore';
import { storeToRefs } from 'pinia';

import { FwbAvatar } from 'flowbite-vue';

const actionStore = useActionStore();
const { chatUser } = storeToRefs(actionStore);   
const { closeChat } = actionStore;
</script>

<style scoped>
/* Add any additional styling if needed */
</style>
