<template>
  <div
    class="flex flex-col h-full bg-gray-50 shadow-lg rounded-lg border border-gray-200"
  >
    <!-- Profile Top Bar -->
    <div
      class="flex items-center justify-between bg-gradient-to-r from-gray-100 to-gray-200 p-4 border-b border-gray-300 rounded-t-lg relative"
    >
      <div class="flex items-center gap-3 flex-none">
        <fwb-avatar
          bordered
          :img="user?.profile?.profile_photo"
          class="w-10 h-10 rounded-full"
        />
        <div>
          <h1 class="text-lg font-semibold text-gray-800">
            {{ user?.profile?.full_name || user?.name }}
          </h1>
        </div>
      </div>
      <div
        class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        <h1 class="text-3xl font-pacifico text-purple-700">Edit Profile</h1>
      </div>
      <div class="flex items-center gap-2 flex-none">
        <!-- Save button (only show when changes exist) -->
        <div class="relative group" v-if="hasUnsavedChanges">
          <button
            @click="saveProfile"
            :disabled="isSaving"
            class="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-all duration-200 disabled:opacity-50"
            title="Save Profile"
          >
            <Save class="w-5 h-5" v-if="!isSaving" />
            <Loader2 class="w-5 h-5 animate-spin" v-else />
          </button>
          <!-- Tooltip -->
          <div
            class="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
          >
            Save Profile
            <div
              class="absolute top-full right-2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"
            ></div>
          </div>
        </div>
        <!-- Delete account button -->
        <div class="relative group">
          <button
            @click="deleteAccount"
            class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
            title="Delete Account"
          >
            <Trash2 class="w-5 h-5" />
          </button>
          <!-- Tooltip -->
          <div
            class="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
          >
            Delete Account
            <div
              class="absolute top-full right-2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"
            ></div>
          </div>
        </div>

        <!-- Close button -->
        <button
          @click="closeProfile"
          class="text-gray-500 hover:text-gray-800 flex-none ml-2 p-2"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Profile Content Area -->
    <div class="flex-1 bg-white overflow-hidden">
      <div class="flex h-full">
        <!-- Left Side - Photo Grid -->
        <div class="w-2/5 p-6 border-r border-gray-200">
          <PhotoGrid />
        </div>

        <!-- Right Side - Profile Info -->
        <div class="w-3/4 p-6 overflow-y-auto">
          <!-- Profile Header -->
          <div class="flex items-center space-x-6 mb-8">
            <div class="w-24 h-24">
              <img
                :src="user?.profile?.profile_photo"
                :alt="user?.profile?.full_name || user?.name"
                class="w-full h-full rounded-full object-cover shadow-lg border-4 border-purple-200"
              />
            </div>
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                {{ user?.profile?.full_name || user?.name }}
              </h2>
              <div class="flex items-center space-x-6 mb-3">
                <div class="flex items-center space-x-2">
                  <span class="text-sm font-medium text-gray-600">Age</span>
                  <span class="text-base font-semibold text-gray-900">
                    {{ calculateAge(user?.profile?.date_of_birth) || "N/A" }}
                  </span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-sm font-medium text-gray-600">Gender</span>
                  <span class="text-base font-semibold text-gray-900">
                    {{ user?.profile?.gender || "N/A" }}
                  </span>
                </div>
              </div>
              <p class="text-sm text-gray-500 font-normal">{{ user?.email }}</p>
            </div>
          </div>

          <!-- Action Button -->
          <div class="mt-8">
            <button
              @click="closeProfile"
              class="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg"
            >
              Close Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { FwbAvatar } from "flowbite-vue";
import { useUserStore } from "../../stores/user";
import { useActionStore } from "../../stores/actionStore";
import { storeToRefs } from "pinia";
import PhotoGrid from "./PhotoGrid.vue";
import { Trash2, Save, Loader2, X } from "lucide-vue-next";

const userStore = useUserStore();
const actionStore = useActionStore();
const { user } = storeToRefs(userStore);
const { closeUserProfile } = actionStore;

// Local state for managing changes
const hasUnsavedChanges = ref(false);
const isSaving = ref(false);

const closeProfile = () => {
  closeUserProfile();
};

// Photo handlers are now managed in PhotoGrid via the store

const saveProfile = async () => {
  if (!hasUnsavedChanges.value) return;

  isSaving.value = true;

  try {
    // TODO: Implement API call to save profile changes
    console.log("Saving profile...");

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // TODO: Update user store with saved data when API is ready
    // userStore.updateProfile({ ... });

    hasUnsavedChanges.value = false;
    console.log("Profile saved successfully!");
  } catch (error) {
    console.error("Failed to save profile:", error);
  } finally {
    isSaving.value = false;
  }
};

const calculateAge = (dateOfBirth: string | null | undefined) => {
  if (!dateOfBirth) return null;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

const deleteAccount = () => {
  console.log("Delete account functionality - I will add logic later");
};
</script>

<style scoped>
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
