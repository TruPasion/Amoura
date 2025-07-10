<template>
  <div class="h-screen w-full flex relative">
    <!-- Sidebar -->
    <div
      :class="[
        'bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-20',
        isHovered ? 'fixed top-0 left-0 h-full w-64' : 'relative w-16',
        'lg:relative lg:w-64 lg:z-auto',
      ]"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <Sidenav />
    </div>

    <!-- Right pane -->
    <div
      class="flex-1 h-full bg-gray-50 overflow-auto"
      style="height: 100vh"
    >
      <Feed />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Sidenav from "../components/Home/Sidenav.vue";
import Feed from "../components/Home/Feed.vue";
const isHovered = ref(false);
</script>
