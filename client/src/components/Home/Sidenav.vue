<template>
  <div class="header m-1">
    <div>
      <div
        :class="
          props.isCollapsed
            ? 'flex items-center justify-center mt-3'
            : 'flex items-center gap-2 m-3'
        "
      >
        <div>
          <fwb-avatar bordered :img="userStore.user?.profile?.profile_photo" />
        </div>
        <div v-if="!props.isCollapsed" class="m-1.5">
          <h1 class="text-lg font-semibold text-gray-700">
            {{ userStore.user?.profile?.full_name }}
          </h1>
        </div>
      </div>
    </div>
  </div>

  <div v-if="!props.isCollapsed" class="font-serif w-full m-3">
    <p>Your Matches appear here</p>
  </div>
</template>

<script setup lang="ts">
import { FwbAvatar } from "flowbite-vue";
import { useUserStore } from "../../stores/user";
const userStore = useUserStore();

const props = defineProps<{
  isCollapsed: boolean;
}>();
</script>
