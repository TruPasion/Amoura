<script setup lang="ts">
import { FwbAvatar } from "flowbite-vue";
import { useUserStore } from "../../stores/user";
import Matches from "../user/Matches.vue";


const userStore = useUserStore();

const props = defineProps<{
  isCollapsed: boolean;
}>();
</script>



<template>
  <div class="header m-1">
    <div>
      <div
        :class="
          props.isCollapsed
            ? 'flex items-center justify-center mt-3 bg-gradient-to-r from-gray-50 to-gray-100 shadow-lg rounded-lg p-3 border border-gray-200'
            : 'flex items-center gap-2 m-3 bg-gradient-to-r from-gray-50 to-gray-100 shadow-lg rounded-lg p-3 border border-gray-200'
        "
      >
        <div class="w-12 h-12">
          <fwb-avatar bordered :img="userStore.user?.profile?.profile_photo" class="rounded-full" />
        </div>
        <div v-if="!props.isCollapsed" class="m-1.5">
          <h1 class="text-lg font-semibold text-gray-700">
            {{ userStore.user?.profile?.full_name }}
          </h1>
        </div>
      </div>
    </div>
  </div>

  <div class="font-serif w-full flex flex-col flex-center">
    <Matches :is-collapsed="props.isCollapsed" />
    <!-- populate the matches here using the component -->
  </div>
</template>

