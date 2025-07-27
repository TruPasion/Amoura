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
        class="bg-gradient-to-r from-gray-50 to-gray-100 shadow-lg rounded-lg p-3 mb-3 hover:shadow-xl transition-shadow duration-300 border border-gray-200"
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
const { getMatches } = actionStore;
const { user } = storeToRefs(userStore);

const props = defineProps<{
  isCollapsed: boolean;
}>();

const { matches } = storeToRefs(actionStore);

onMounted(async () => {
  if (user.value && user.value.id) {
    await getMatches(user.value.id);
  }
});
</script>
