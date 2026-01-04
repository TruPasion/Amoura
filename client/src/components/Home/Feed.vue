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
      class="feb-card flex border-2 border-purple-200 rounded-2xl shadow-2xl overflow-hidden flex-grow w-full bg-white"
      style="max-height: calc(100vh - 8rem)"
    >
      <template v-if="nearbyUsers.length > 0">
        <!-- Left Side: Image Carousel with Beautiful Frame -->
        <div
          class="w-1/2 flex items-center justify-center relative bg-gradient-to-br from-purple-50 to-pink-50 p-4"
        >
          <div class="relative w-full h-full flex items-center justify-center">
            <!-- Beautiful Photo Frame -->
            <div
              class="relative rounded-3xl overflow-hidden shadow-2xl bg-white p-2 max-w-full max-h-full"
            >
              <GcpImage
                :src="
                  (() => {
                    const photo = getCurrentPhoto();
                    return photo || lastUser?.profile_photo;
                  })()
                "
                alt="User Image"
                img-class="w-full h-full object-cover rounded-2xl"
                :style="{ aspectRatio: '3/4', maxHeight: '70vh' }"
              />

              <!-- Elegant overlay gradient -->
              <div
                class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-2xl"
              ></div>
            </div>

            <!-- Navigation Arrows (only show if multiple photos) -->
            <template v-if="(lastUser?.photos?.length || 0) > 1">
              <!-- Left Arrow -->
              <button
                v-if="currentPhotoIndex > 0"
                @click="previousPhoto"
                class="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-purple-600 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              >
                <ChevronLeft class="w-6 h-6" />
              </button>

              <!-- Right Arrow -->
              <button
                v-if="currentPhotoIndex < (lastUser?.photos?.length || 0) - 1"
                @click="nextPhoto"
                class="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-purple-600 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              >
                <ChevronRight class="w-6 h-6" />
              </button>
            </template>

            <!-- Elegant Dots Navigation -->
            <template v-if="(lastUser?.photos?.length || 0) > 1">
              <div
                class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-3 bg-white/90 px-4 py-2 rounded-full shadow-lg"
              >
                <button
                  v-for="(_, index) in lastUser?.photos"
                  :key="index"
                  @click="currentPhotoIndex = index"
                  class="w-3 h-3 rounded-full transition-all duration-300"
                  :class="
                    index === currentPhotoIndex
                      ? 'bg-purple-600 w-8'
                      : 'bg-purple-200 hover:bg-purple-300'
                  "
                ></button>
              </div>
            </template>
          </div>
        </div>

        <!-- Vertical Divider Line -->
        <div
          class="w-0.5 bg-gradient-to-b from-purple-200/50 via-gray-300 to-purple-200/50 shadow-sm"
        ></div>

        <!-- Right Side: Enhanced User Details -->
        <div
          class="w-1/2 flex flex-col bg-gradient-to-br from-slate-100 to-gray-200"
        >
          <!-- Scrollable Content Area -->
          <div class="flex-1 p-8 overflow-y-auto">
            <div class="space-y-6">
              <!-- User Info and Bio Side by Side -->
              <div class="grid grid-cols-2 gap-4 mb-6">
                <!-- User Info with Profile Photo -->
                <div
                  class="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50"
                >
                  <div class="flex items-start gap-4">
                    <!-- Circular Profile Photo -->
                    <div class="flex-shrink-0">
                      <GcpImage
                        :src="
                          lastUser?.profile_photo ||
                          (lastUser?.photos && lastUser.photos[0])
                        "
                        alt="Profile"
                        img-class="w-20 h-20 rounded-full object-cover shadow-lg border-4 border-purple-200"
                      />
                    </div>

                    <!-- Name and Basic Info -->
                    <div class="flex-grow">
                      <h2
                        class="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1"
                      >
                        {{ lastUser?.full_name }}
                      </h2>
                      <div
                        class="flex items-center gap-3 text-sm text-gray-600 mb-2"
                      >
                        <span class="bg-purple-100 px-2 py-1 rounded-full"
                          >{{ lastUser?.age }} years</span
                        >
                        <span class="bg-pink-100 px-2 py-1 rounded-full">{{
                          lastUser?.gender
                        }}</span>
                      </div>
                      <p class="text-purple-600 font-medium text-sm">
                        📍
                        {{
                          lastUser?.distance
                            ? (lastUser.distance / 1000).toFixed(1)
                            : "Unknown"
                        }}
                        km away
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Bio Section -->
                <div
                  v-if="lastUser?.bio"
                  class="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50"
                >
                  <h3
                    class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2"
                  >
                    💬 About
                  </h3>
                  <p class="text-gray-700 text-sm italic">{{ lastUser.bio }}</p>
                </div>

                <!-- Empty placeholder if no bio -->
                <div
                  v-else
                  class="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/30 opacity-70"
                >
                  <h3
                    class="text-lg font-semibold text-gray-400 mb-3 flex items-center gap-2"
                  >
                    💬 About
                  </h3>
                  <p class="text-gray-400 text-sm italic">No bio available</p>
                </div>
              </div>

              <!-- Professional and Lifestyle Side by Side -->
              <div class="grid grid-cols-2 gap-4">
                <!-- Professional Info -->
                <div
                  v-if="
                    lastUser?.job_title ||
                    lastUser?.company ||
                    lastUser?.education
                  "
                  class="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50"
                >
                  <h3
                    class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2"
                  >
                    💼 Professional
                  </h3>
                  <div class="space-y-2">
                    <!-- First Row: 2 items side by side -->
                    <div class="grid grid-cols-2 gap-2">
                      <div
                        v-if="lastUser?.job_title"
                        class="text-center bg-purple-50 rounded-lg p-3"
                      >
                        <div class="text-lg mb-1">🎯</div>
                        <div class="text-xs text-gray-500 mb-1">Works as</div>
                        <div class="text-xs text-gray-700 font-medium">
                          {{ lastUser.job_title }}
                        </div>
                      </div>
                      <div
                        v-if="lastUser?.company"
                        class="text-center bg-blue-50 rounded-lg p-3"
                      >
                        <div class="text-lg mb-1">🏢</div>
                        <div class="text-xs text-gray-500 mb-1">Works at</div>
                        <div class="text-xs text-gray-700 font-medium">
                          {{ lastUser.company }}
                        </div>
                      </div>
                    </div>

                    <!-- Second Row: 1 item full width -->
                    <div
                      v-if="lastUser?.education"
                      class="text-center bg-green-50 rounded-lg p-3"
                    >
                      <div class="text-lg mb-1">🎓</div>
                      <div class="text-xs text-gray-500 mb-1">Studied at</div>
                      <div class="text-xs text-gray-700 font-medium">
                        {{ lastUser.education }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Lifestyle -->
                <div
                  class="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50"
                >
                  <h3
                    class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2"
                  >
                    🌟 Lifestyle
                  </h3>
                  <div class="grid grid-cols-2 gap-2">
                    <div
                      v-if="lastUser?.height_cm"
                      class="text-center bg-purple-50 rounded-lg p-2"
                    >
                      <div class="text-lg">📏</div>
                      <div class="text-xs text-gray-600">
                        {{ lastUser.height_cm }} cm
                      </div>
                    </div>
                    <div
                      v-if="lastUser?.drinking_id"
                      class="text-center bg-blue-50 rounded-lg p-2"
                    >
                      <div class="text-lg">🍷</div>
                      <div class="text-xs text-gray-600">Social</div>
                    </div>
                    <div
                      v-if="lastUser?.smoking_id"
                      class="text-center bg-orange-50 rounded-lg p-2"
                    >
                      <div class="text-lg">🚭</div>
                      <div class="text-xs text-gray-600">Non-Smoker</div>
                    </div>
                    <div
                      v-if="lastUser?.exercise_id"
                      class="text-center bg-green-50 rounded-lg p-2"
                    >
                      <div class="text-lg">💪</div>
                      <div class="text-xs text-gray-600">Active</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Interests -->
              <div
                v-if="lastUser?.interests && lastUser.interests.length > 0"
                class="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50"
              >
                <h3
                  class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2"
                >
                  ❤️ Interests
                </h3>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="interest in lastUser.interests.slice(0, 6)"
                    :key="interest"
                    class="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {{ getInterestLabel(interest) }}
                  </span>
                  <span
                    v-if="lastUser.interests.length > 6"
                    class="text-gray-500 text-sm"
                  >
                    +{{ lastUser.interests.length - 6 }} more
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Fixed Action Buttons Area -->
          <div class="p-6 bg-white border-t border-gray-200">
            <div class="space-y-4">
              <div class="flex gap-3 justify-center">
                <button
                  @click="userAction('send_aura')"
                  class="btn-modern btn-success flex items-center gap-2 flex-1"
                >
                  <Flame class="w-5 h-5" /> Send Aura
                </button>
                <button
                  v-if="lastSeenProfile"
                  @click="userAction('rewind')"
                  class="btn-modern btn-primary flex items-center justify-center gap-2 flex-1"
                >
                  <Rewind class="w-5 h-5" /> Rewind
                </button>
                <button
                  @click="userAction('skip')"
                  class="btn-modern btn-danger flex items-center gap-2 flex-1"
                >
                  <X class="w-5 h-5" /> Pass
                </button>
              </div>

              <!-- Report and Block -->
              <!--               <div class="flex justify-center gap-8 mt-4 text-sm">
                <button
                  class="text-gray-400 hover:text-red-500 transition-colors"
                >
                  Report
                </button>
                <button
                  class="text-gray-400 hover:text-red-500 transition-colors"
                >
                  Block
                </button>
              </div> -->
            </div>
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
import GcpImage from "../common/GcpImage.vue";
import { interestsOptions } from "../../utils/profileOptions";

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

// Helper function to get interest label by ID
const getInterestLabel = (interestId: number): string => {
  const interest = interestsOptions.find((opt) => opt.id === interestId);
  return interest ? interest.label : `Interest ${interestId}`;
};

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
  });
  return currentPhoto; // Now returns string URL directly
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
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.feb-card {
  background: linear-gradient(145deg, #ffffff, #f8fafc);
  backdrop-filter: blur(10px);
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

.btn-modern {
  padding: 1rem 1.5rem;
  border-radius: 1rem;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  transform: translateY(0);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
}

.btn-modern:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.btn-modern:active {
  transform: translateY(1px);
}

.btn-success,
.btn-modern.btn-success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: 2px solid transparent;
}

.btn-success:hover,
.btn-modern.btn-success:hover {
  background: linear-gradient(135deg, #059669, #047857);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
}

.btn-danger,
.btn-modern.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: 2px solid transparent;
}

.btn-danger:hover,
.btn-modern.btn-danger:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
}

.btn-primary,
.btn-modern.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: 2px solid transparent;
}

.btn-primary:hover,
.btn-modern.btn-primary:hover {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
}

/* Custom scrollbar for right panel */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #a855f7, #ec4899);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #9333ea, #db2777);
}

/* Gradient text animation */
@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.bg-clip-text {
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
}

/* Enhanced card shadows */
.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Smooth transitions for all interactive elements */
* {
  transition: color 0.2s ease, background-color 0.2s ease, transform 0.2s ease,
    box-shadow 0.2s ease;
}

/* Responsive design improvements */
@media (max-width: 1024px) {
  .feb-card {
    flex-direction: column;
  }

  .w-1\/2 {
    width: 100%;
  }

  .grid-cols-2 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
