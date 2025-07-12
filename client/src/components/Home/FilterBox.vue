<template>
  <div
    class="filter-box bg-white shadow-lg rounded-lg p-6 absolute top-16 left-4"
  >
    <h2 class="text-lg font-semibold mb-6">Filters</h2>

    <!-- Range Slider -->
    <div class="mb-6">
      <label for="range" class="block text-sm font-medium text-gray-700 mb-2"
        >Range</label
      >
      <input
        id="range"
        type="range"
        v-model="range"
        min="20"
        max="100"
        class="w-full"
      />
      <p class="text-sm text-gray-500 mt-2">Selected Range: {{ range }} km</p>
    </div>

    <!-- Gender Selection -->
    <div class="mb-6">
      <label for="gender" class="block text-sm font-medium text-gray-700 mb-2"
        >Gender</label
      >
      <select id="gender" v-model="gender" class="w-full border rounded p-2">
        <option value="">All</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>
    </div>

    <!-- Age Range Slider -->
    <div class="mb-6">
      <label
        for="age-range"
        class="block text-sm font-medium text-gray-700 mb-2"
        >Age Range</label
      >
      <div class="flex items-center gap-4">
        <input
          id="age-range-min"
          type="number"
          v-model="ageRange.min"
          min="18"
          max="100"
          class="w-20 border rounded p-2 text-center"
        />
        <span class="text-sm text-gray-500">to</span>
        <input
          id="age-range-max"
          type="number"
          v-model="ageRange.max"
          min="18"
          max="100"
          class="w-20 border rounded p-2 text-center"
        />
      </div>
      <p class="text-sm text-gray-500 mt-2">
        Selected Age Range: {{ ageRange.min }} - {{ ageRange.max }}
      </p>
    </div>

    <!-- Buttons -->
    <div class="flex justify-end gap-4">
      <button @click="cancel" class="btn btn-danger">Cancel</button>
      <button @click="apply" class="btn btn-success">Apply</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from "vue";

import { useUserStore } from "../../stores/user";
import { storeToRefs } from "pinia";
const userStore = useUserStore();
const { range, gender, ageRange } = storeToRefs(userStore);

const emit = defineEmits(["close", "applyFilters"]);

function cancel() {
  emit("close");
}

async function apply() {
  const nearbyUsers = await userStore.getnearbyusers();
  console.log("Nearby Users:", nearbyUsers);

  emit("applyFilters", {
    range: range.value,
    gender: gender.value,
    ageRange: ageRange.value,
  });
  cancel();
}
</script>

<style scoped>
.filter-box {
  width: 320px;
}
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
}
.btn-danger {
  background-color: #f44336;
  color: white;
}
.btn-success {
  background-color: #4caf50;
  color: white;
}
</style>
