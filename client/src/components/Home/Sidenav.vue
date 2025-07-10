<template>
  <div class="header m-1">
    <fwb-card>
      <div class="flex gap-2 m-3">
        <div>
          <fwb-avatar bordered img="/avatar.avif" />
        </div>
        <div class="m-1.5">
          <h1 class="text-lg font-semibold text-white">
            {{ userStore.user?.profile?.full_name }}
          </h1>
        </div>
      </div>
    </fwb-card>
  </div>

  <div class="font-serif w-full m-3">
    <p>Your Matches appear here</p>
  </div>
</template>

<script setup lang="ts">
import { FwbAvatar, FwbCard } from "flowbite-vue";
import { useUserStore } from "../../stores/user";
const userStore = useUserStore();
</script>
