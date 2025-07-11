<template>
  <div class="feed-container flex flex-col h-screen p-4">
    <!-- Filters and Header -->
    <div class="flex items-center mb-4">
      <div class="filters flex-none relative">
        <ListFilter class="w-6 h-6 text-gray-600 cursor-pointer" @click="toggleFilterBox" />
        <FilterBox v-if="showFilterBox" @close="showFilterBox = false" @applyFilters="handleApplyFilters" />
      </div>
      <div class="flex-grow text-center">
        <h1 class="text-5xl font-pacifico text-purple-700">Amoura</h1>
      </div>
    </div>

    <!-- Filter Box Component - Shown/Hidden based on state -->
    <!-- <FilterBox v-if="showFilterBox" @close="showFilterBox = false" /> -->

    <!-- Card Section -->
    <div
      class="feb-card flex border rounded-lg shadow-md overflow-hidden flex-grow w-full"
    >
      <!-- Left Half: Image -->
      <div class="w-3/5 flex items-center justify-center">
        <img
          src="/avatar.avif"
          alt="User Image"
          class="max-w-full max-h-full object-contain"
        />
      </div>

      <!-- Right Half: User Details -->
      <div class="w-2/5 p-6 flex flex-col justify-between">
        <div>
          <h2 class="text-3xl font-semibold">Bhargav</h2>
          <p class="text-lg text-gray-600">Male, 25</p>
          <p class="text-lg text-gray-600">Location: Hyderabad</p>
        </div>

        <!-- Buttons -->
        <div class="flex gap-6">
          <button class="btn btn-success flex items-center gap-2">
            <Flame name="check" class="w-6 h-6" /> Accept
          </button>
          <button class="btn btn-danger flex items-center gap-2">
            <X name="x" class="w-6 h-6" /> Reject
          </button>
        </div>

        <!-- Report and Block -->
        <div class="flex gap-6 mt-6 text-lg text-gray-500">
          <button class="hover:text-red-500">Report</button>
          <button class="hover:text-red-500">Block</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ListFilter, Flame, X } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import FilterBox from "./FilterBox.vue";

const isHovered = ref(false);
const showFilterBox = ref(false);

function toggleFilterBox() {
  showFilterBox.value = !showFilterBox.value;
}

// get the feeds with nearby users
onMounted(() => {
  // Any initialization logic can go here
  isHovered.value = false; // Initialize hover state
  console.log("Feed component mounted");
});

function handleApplyFilters(filters: { range: number; gender: string; ageRange: { min: number; max: number } }) {
  // Handle the apply filters logic here
  console.log("Filters applied:", filters);
}
</script>

<style scoped>
.feed-container {
  width: 100%;
  margin: 0 auto;
}
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
}
.btn-success {
  background-color: #4caf50;
  color: white;
}
.btn-danger {
  background-color: #f44336;
  color: white;
}
</style>
