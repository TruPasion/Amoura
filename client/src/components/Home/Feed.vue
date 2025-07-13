<template>
  <div class="feed-container flex flex-col h-screen p-4">
    <!-- Filters and Header -->
    <div class="flex items-center mb-4">
      <div class="filters flex-none relative">
        <ListFilter
          class="w-6 h-6 text-gray-600 cursor-pointer"
          @click="toggleFilterBox"
        />
        <FilterBox
          v-if="showFilterBox"
          @close="showFilterBox = false"
          @applyFilters="handleApplyFilters"
        />
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
      <template v-if="nearbyUsers.length > 0">
        <!-- Left Half: Image -->
        <div class="w-3/5 flex items-center justify-center">
          <img
            :src="lastUser?.profile_photo"
            alt="User Image"
            class="max-w-full max-h-full object-contain"
          />
        </div>

        <!-- Right Half: User Details -->
        <div class="w-2/5 p-6 flex flex-col justify-between">
          <div>
            <h2 class="text-3xl font-semibold">{{ lastUser?.full_name }}</h2>
            <p class="text-lg text-gray-600">{{ lastUser?.gender }}</p>
            <p class="text-lg text-gray-600">Age: {{ lastUser?.age }}</p>

            <p class="text-lg text-gray-600">
              Location:
              {{
                lastUser?.distance
                  ? (lastUser.distance / 1000).toFixed(1)
                  : "Unknown"
              }}
              kms away
            </p>
          </div>

          <!-- Buttons -->
          <div class="flex flex-wrap gap-4 justify-center mt-4">
            <button
              @click="userAction('send_aura')"
              class="btn btn-success flex items-center gap-2"
            >
              <Flame name="check" class="w-6 h-6" /> Send Aura
            </button>
            <button
              @click="userAction('skip')"
              class="btn btn-danger flex items-center gap-2"
            >
              <X name="x" class="w-6 h-6" /> Skip
            </button>
            <button
            v-if="lastSeenProfile"
              @click="userAction('rewind')"
              class="btn btn-primary flex items-center gap-2"
            >
              <Rewind name="rewind" class="w-6 h-6" /> Rewind
            </button>
          </div>

          <!-- Report and Block -->
          <div class="flex gap-6 mt-6 text-lg text-gray-500">
            <button class="hover:text-red-500">Report</button>
            <button class="hover:text-red-500">Block</button>
          </div>
        </div>
      </template>
      <template v-else>
        <div
          class="flex items-center justify-center w-full h-full font-Pacifico"
        >
          <p class="text-gray-500">No nearby users found.</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ListFilter, Flame, X, Rewind } from "lucide-vue-next";
import { onMounted, ref, computed } from "vue";
import FilterBox from "./FilterBox.vue";

import { useUserStore } from "../../stores/user";
import { storeToRefs } from "pinia";
const userStore = useUserStore();
const { nearbyUsers, lastSeenProfile } = storeToRefs(userStore);

const { getnearbyusers, userProfileAction, undoUserAction } = userStore;

const lastUser = computed(() => {
  return nearbyUsers.value.length > 0
    ? nearbyUsers.value[nearbyUsers.value.length - 1]
    : null;
});

console.log("Last User:", lastUser.value);

const showFilterBox = ref(false);

const userAction = (action: "send_aura" | "rewind" | "skip") => {
  switch (action) {
    case "send_aura":
      userProfileAction(true);
      break;
    case "rewind":
      undoUserAction();
      break;
    case "skip":
      userProfileAction(false);
      break;
    default:
      console.warn(`Unknown action: ${action}`);
  }
};

function toggleFilterBox() {
  showFilterBox.value = !showFilterBox.value;
}

// get the feeds with nearby users
onMounted(async () => {
  await getnearbyusers();
  console.log("Feed component mounted");
});

function handleApplyFilters(filters: {
  range: number;
  gender: string;
  ageRange: { min: number; max: number };
}) {
  // Handle the apply filters logic here
  console.log("Filters applied:", filters);
}
</script>

<style scoped>
.feed-container {
  width: 100%;
  margin: 0 auto;
  background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}
.btn-success {
  background-color: #4caf50;
  color: white;
}
.btn-danger {
  background-color: #f44336;
  color: white;
}
.btn-primary {
  background-color: #3b82f6;
  color: white;
}
.text-lg {
  font-size: 1.125rem;
  color: #374151;
}
.text-3xl {
  font-size: 1.875rem;
  color: #1f2937;
}
</style>
