<template>
  <div class="feed-container flex flex-col h-full p-4">
    <!-- Filters and Header -->
    <div class="flex items-center mb-4">
      <div class="filters flex-none relative z-50">
        <ListFilter
          class="w-6 h-6 text-gray-600 cursor-pointer"
          @click="toggleFilterBox"
        />
        <FilterBox v-if="showFilterBox" @close="showFilterBox = false" />
      </div>
      <div class="flex-grow text-center">
        <h1 class="text-5xl font-pacifico text-purple-700">Amoura</h1>
      </div>
      <!-- Logout Button -->
      <div class="flex-none mr-4">
        <button
          @click="logoutuser"
          class="btn btn-danger flex items-center gap-2"
        >
          <LogOut class="w-5 h-5" /> Logout
        </button>
      </div>
    </div>

    <!-- Card Section -->
    <div
      class="feb-card flex border rounded-lg shadow-md overflow-hidden flex-grow w-full"
      style="max-height: calc(100vh - 8rem)"
    >
      <template v-if="nearbyUsers.length > 0">
        <!-- Left Half: Image Carousel -->
        <div class="w-3/5 flex items-center justify-center relative">
          <div class="relative w-full h-full flex items-center justify-center">
            <!-- Main Image -->
            <img
              :src="
                (() => {
                  const photo = getCurrentPhoto();
                  return (
                    (typeof photo === 'string' ? photo : photo?.image_url) ||
                    lastUser?.profile_photo.image_url
                  );
                })()
              "
              alt="User Image"
              class="max-w-full max-h-full object-contain rounded-lg"
            />

            <!-- Navigation Arrows (only show if multiple photos) -->
            <template v-if="(lastUser?.photos?.length || 0) > 1">
              <!-- Left Arrow -->
              <button
                v-if="currentPhotoIndex > 0"
                @click="previousPhoto"
                class="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
              >
                <ChevronLeft class="w-6 h-6" />
              </button>

              <!-- Right Arrow -->
              <button
                v-if="currentPhotoIndex < (lastUser?.photos?.length || 0) - 1"
                @click="nextPhoto"
                class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
              >
                <ChevronRight class="w-6 h-6" />
              </button>
            </template>

            <!-- Dots Navigation (only show if multiple photos) -->
            <template v-if="(lastUser?.photos?.length || 0) > 1">
              <div
                class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2"
              >
                <button
                  v-for="(photo, index) in lastUser?.photos"
                  :key="photo.id || index"
                  @click="currentPhotoIndex = index"
                  class="w-2 h-2 rounded-full transition-all duration-200"
                  :class="
                    index === currentPhotoIndex
                      ? 'bg-purple-600 w-6'
                      : 'bg-white bg-opacity-60 hover:bg-opacity-80'
                  "
                ></button>
              </div>
            </template>
          </div>
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
import {
  ListFilter,
  Flame,
  X,
  Rewind,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import FilterBox from "./FilterBox.vue";

import { useUserStore } from "../../stores/user";
import { storeToRefs } from "pinia";
const router = useRouter();
const userStore = useUserStore();
const { nearbyUsers, lastSeenProfile } = storeToRefs(userStore);

const { getnearbyusers, userProfileAction, undoUserAction } = userStore;

const lastUser = computed(() => {
  const user =
    nearbyUsers.value.length > 0
      ? nearbyUsers.value[nearbyUsers.value.length - 1]
      : null;

  if (user) {
    console.log("👤 lastUser computed:", {
      name: user.full_name,
      profile_photo: user.profile_photo,
      photos: user.photos,
      photosCount: user.photos?.length || 0,
    });
  }

  return user;
});

const showFilterBox = ref(false);
const currentPhotoIndex = ref(0);

// Reset photo index when user changes
const resetPhotoIndex = () => {
  console.log(
    "🔄 resetPhotoIndex: Resetting from",
    currentPhotoIndex.value,
    "to 0"
  );
  currentPhotoIndex.value = 0;
};

// Get current photo based on index
const getCurrentPhoto = () => {
  if (!lastUser.value?.photos || lastUser.value.photos.length === 0) {
    console.log("🔍 getCurrentPhoto: No photos available", {
      hasPhotos: !!lastUser.value?.photos,
      photosLength: lastUser.value?.photos?.length || 0,
    });
    return null;
  }
  const currentPhoto = lastUser.value.photos[currentPhotoIndex.value];
  console.log("🔍 getCurrentPhoto:", {
    currentPhotoIndex: currentPhotoIndex.value,
    totalPhotos: lastUser.value.photos.length,
    currentPhoto: currentPhoto,
    isString: typeof currentPhoto === "string",
    isObject: typeof currentPhoto === "object",
    imageUrl:
      typeof currentPhoto === "string" ? currentPhoto : currentPhoto?.image_url,
  });
  return currentPhoto;
};

// Navigation functions
const nextPhoto = () => {
  console.log("➡️ nextPhoto called:", {
    currentIndex: currentPhotoIndex.value,
    totalPhotos: lastUser.value?.photos?.length || 0,
    canGoNext:
      lastUser.value?.photos &&
      currentPhotoIndex.value < lastUser.value.photos.length - 1,
  });

  if (
    lastUser.value?.photos &&
    currentPhotoIndex.value < lastUser.value.photos.length - 1
  ) {
    currentPhotoIndex.value++;
    console.log("✅ nextPhoto: Index changed to", currentPhotoIndex.value);
  } else {
    console.log("⚠️ nextPhoto: Cannot go next");
  }
};

const previousPhoto = () => {
  console.log("⬅️ previousPhoto called:", {
    currentIndex: currentPhotoIndex.value,
    canGoPrevious: currentPhotoIndex.value > 0,
  });

  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--;
    console.log("✅ previousPhoto: Index changed to", currentPhotoIndex.value);
  } else {
    console.log("⚠️ previousPhoto: Cannot go previous");
  }
};

const userAction = (action: "send_aura" | "rewind" | "skip") => {
  switch (action) {
    case "send_aura":
      userProfileAction(true);
      resetPhotoIndex(); // Reset when moving to next user
      break;
    case "rewind":
      undoUserAction();
      resetPhotoIndex(); // Reset when rewinding
      break;
    case "skip":
      userProfileAction(false);
      resetPhotoIndex(); // Reset when skipping
      break;
    default:
      console.warn(`Unknown action: ${action}`);
  }
};

function toggleFilterBox() {
  showFilterBox.value = !showFilterBox.value;
}

async function logoutuser() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      // Clear user data from store
      userStore.user = null;
      nearbyUsers.value = [];
      lastSeenProfile.value = null;

      // Redirect to landing page
      router.push("/");
    } else {
      console.error("Logout failed:", await response.text());
    }
  } catch (error) {
    console.error("Error during logout:", error);
  }
}

onMounted(async () => {
  if (!nearbyUsers.value.length) {
    await getnearbyusers();
  }
});
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
