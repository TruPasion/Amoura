<template>
  <template v-if="matches.length">
    <div class="flex items-center justify-center">
        <p v-if="!props.isCollapsed">Your Matches appear here</p>
    <p v-else>Match</p>
    </div>
    <ul>
      <li
        v-for="match in matches"
        :key="match.user_id"
        :class="[
          'bg-white shadow-md rounded-lg p-4 mb-4 hover:shadow-lg transition-shadow duration-300 border cursor-pointer',
          chatUser?.user_id === match.user_id ? 'border-blue-600 ring-2 ring-blue-400' : 'border-gray-300'
        ]"
        @click="openChat(match)"
        style="margin: 0.5rem; padding: 1rem;"
      >
        <div
          :class="
            props.isCollapsed
              ? 'flex items-center justify-center mt-3'
              : 'flex items-center gap-4'
          "
        >
          <div class="w-12 h-12">
            <fwb-avatar bordered :img="match.profile_photo" class="rounded-full" />
          </div>
          <div v-if="!props.isCollapsed" class="flex-1">
            <h1 class="text-lg font-semibold text-gray-800">
              {{ match.full_name }}
            </h1>
            <p class="text-sm text-gray-500">Last seen recently</p>
          </div>
        </div>
      </li>
    </ul>
  </template>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { FwbAvatar } from "flowbite-vue";
import { useUserStore } from "../../stores/user";
import { storeToRefs } from "pinia";
import { useActionStore } from "../../stores/actionStore";

const userStore = useUserStore();
const actionStore = useActionStore();
const { getMatches, openChat } = actionStore;
const { user } = storeToRefs(userStore);

const props = defineProps<{
  isCollapsed: boolean;
}>();

const { matches, chatUser } = storeToRefs(actionStore);

onMounted(async () => {
  if (user.value && user.value.id) {
    await getMatches(user.value.id);
  }
});
</script>
