<template>
  <div class="h-screen w-full flex relative">
    <!-- Sidebar -->
    <div
      :class="[
        'bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-20',
        isHovered ? 'fixed top-0 left-0 h-full w-64' : 'relative w-16',
        'lg:relative lg:w-64 lg:z-auto'
      ]"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <!-- Sidebar content -->
    </div>

    <!-- Right pane -->
    <div
      class="flex-1 h-full bg-gray-50 border-2 border-red-300 overflow-auto"
      style="height: 100vh;"
    >
      <!-- Feed content -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const isHovered = ref(false)
</script>
