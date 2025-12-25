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
          :img="user?.profile?.profile_photo?.image_url"
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
          <PhotoGrid @has-changes="handleChanges" />
        </div>

        <!-- Right Side - Profile Info -->
        <div class="w-3/4 p-6 overflow-y-auto">
          <!-- Profile Header -->
          <div class="flex items-center space-x-6 mb-8">
            <div class="w-24 h-24">
              <img
                :src="user?.profile?.profile_photo?.image_url"
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

    <!-- Confirmation Dialog -->
    <div
      v-if="showConfirmDialog"
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="showConfirmDialog = false"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ease-out scale-100"
      >
        <!-- Dialog Header -->
        <div class="p-6 pb-4">
          <div class="flex items-center justify-center mb-4">
            <div
              class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
            >
              <AlertTriangle class="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 class="text-xl font-bold text-gray-900 text-center mb-2">
            Save Your Changes?
          </h3>
          <p class="text-gray-600 text-center text-sm leading-relaxed">
            You have unsaved changes to your profile photos. Would you like to
            save them before leaving?
          </p>
        </div>

        <!-- Dialog Actions -->
        <div class="px-6 pb-6">
          <div class="flex flex-col gap-3">
            <!-- Save Button -->
            <button
              @click="confirmSave"
              :disabled="isSaving"
              class="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <Save class="w-5 h-5" v-if="!isSaving" />
              <Loader2 class="w-5 h-5 animate-spin" v-else />
              {{ isSaving ? "Saving..." : "Save Changes" }}
            </button>

            <!-- Discard Button -->
            <button
              @click="confirmDiscard"
              :disabled="isSaving"
              class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trash2 class="w-5 h-5" />
              Discard Changes
            </button>

            <!-- Cancel Button -->
            <button
              @click="showConfirmDialog = false"
              :disabled="isSaving"
              class="w-full text-gray-500 hover:text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted } from "vue";
import { FwbAvatar } from "flowbite-vue";
import { useUserStore } from "../../stores/user";
import { useActionStore } from "../../stores/actionStore";
import { storeToRefs } from "pinia";
import PhotoGrid from "./PhotoGrid.vue";
import { Trash2, Save, Loader2, X, AlertTriangle } from "lucide-vue-next";

const userStore = useUserStore();
const actionStore = useActionStore();
const { user, hasUnsavedChanges } = storeToRefs(userStore);
const { closeUserProfile } = actionStore;

// Local state for managing changes
const isSaving = ref(false);
const showConfirmDialog = ref(false);
let pendingCloseAction: (() => void) | null = null;
let isComponentMounted = ref(true);

const handleChanges = (hasChanges: boolean) => {
  // This is handled automatically by the store now
  // but we keep this handler in case we need additional logic
  console.log("Profile has unsaved changes:", hasChanges);
};

// Helper function to truncate base64 URLs for cleaner console output
const truncateBase64InObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    // Check if it's a base64 data URL
    if (obj.startsWith("data:image/") && obj.includes("base64,")) {
      const [prefix, base64Data] = obj.split("base64,");
      if (base64Data && base64Data.length > 50) {
        return `${prefix}base64,${base64Data.substring(0, 50)}...truncated(${
          base64Data.length
        } chars)`;
      }
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => truncateBase64InObject(item));
  }

  if (typeof obj === "object") {
    const truncated: any = {};
    for (const [key, value] of Object.entries(obj)) {
      truncated[key] = truncateBase64InObject(value);
    }
    return truncated;
  }

  return obj;
};

const closeProfile = () => {
  if (hasUnsavedChanges.value) {
    pendingCloseAction = () => {
      // Force close by directly setting the state
      actionStore.openProfile = false;
    };
    showConfirmDialog.value = true;
  } else {
    actionStore.openProfile = false;
  }
};

// Helper function to convert base64 to file and upload
const uploadBase64AsFile = async (base64Data: string): Promise<string> => {
  try {
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();

    // Create FormData
    const formData = new FormData();
    formData.append("image", blob, "photo.jpg");

    // Upload file
    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload image");
    }

    const result = await uploadResponse.json();
    return result.fileUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

// Process delta to upload base64 images first
const processDeltaWithFileUploads = async (delta: any) => {
  const processedDelta = { ...delta };

  // Process profile photo change
  if (
    processedDelta.profile_photo_change?.image_url?.startsWith("data:image/")
  ) {
    console.log("Uploading profile photo...");
    processedDelta.profile_photo_change.image_url = await uploadBase64AsFile(
      processedDelta.profile_photo_change.image_url
    );
    console.log(
      "✅ Profile photo uploaded:",
      processedDelta.profile_photo_change.image_url
    );
  }

  // Process added photos
  if (processedDelta.added_photos?.length > 0) {
    for (const photo of processedDelta.added_photos) {
      if (photo.image_url?.startsWith("data:image/")) {
        console.log(`Uploading added photo at position ${photo.position}...`);
        photo.image_url = await uploadBase64AsFile(photo.image_url);
        console.log("✅ Added photo uploaded:", photo.image_url);
      }
    }
  }

  return processedDelta;
};

// Photo handlers are now managed in PhotoGrid via the store

const saveProfile = async () => {
  if (!hasUnsavedChanges.value) return;

  isSaving.value = true;

  try {
    // Call store's save function which logs the delta
    const delta = userStore.saveProfileChanges();

    console.log("=== SAVE OPERATION ===");
    console.log("Saving profile with delta:", truncateBase64InObject(delta));

    // Process delta to upload files first
    const processedDelta = await processDeltaWithFileUploads(delta);

    // Call the upload-delta API endpoint
    const response = await fetch("/api/users/upload-delta", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.value?.id,
        ...processedDelta,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to save profile changes");
    }

    const result = await response.json();
    console.log("✅ Profile saved successfully! Response:", result);

    // After successful API call, update original data and reset changes
    userStore.updateOriginalData();
    userStore.resetChanges();

    console.log("✅ Profile saved successfully!");
    console.log("===================");
  } catch (error) {
    console.error("❌ Failed to save profile:", error);
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

const confirmSave = async () => {
  try {
    await saveProfile();
    showConfirmDialog.value = false;
    if (pendingCloseAction) {
      pendingCloseAction();
      pendingCloseAction = null;
    }
  } catch (error) {
    // Error handling is already done in saveProfile
  }
};

const confirmDiscard = () => {
  userStore.revertToOriginalData();
  showConfirmDialog.value = false;
  if (pendingCloseAction) {
    pendingCloseAction();
    pendingCloseAction = null;
  }
};

// Handle page navigation/refresh
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (hasUnsavedChanges.value && isComponentMounted.value) {
    event.preventDefault();
    event.returnValue =
      "You have unsaved changes. Are you sure you want to leave?";
    return event.returnValue;
  }
};

// Override the close action to check for unsaved changes
const originalCloseUserProfile = closeUserProfile;
const interceptedCloseUserProfile = () => {
  if (hasUnsavedChanges.value && isComponentMounted.value) {
    pendingCloseAction = originalCloseUserProfile;
    showConfirmDialog.value = true;
  } else {
    originalCloseUserProfile();
  }
};

// Lifecycle hooks
onMounted(() => {
  isComponentMounted.value = true;
  window.addEventListener("beforeunload", handleBeforeUnload);
  // Replace the action store method temporarily
  actionStore.closeUserProfile = interceptedCloseUserProfile;
});

// Handle component unmount
onBeforeUnmount(() => {
  // Restore original method
  actionStore.closeUserProfile = originalCloseUserProfile;
  isComponentMounted.value = false;
  window.removeEventListener("beforeunload", handleBeforeUnload);

  // If there are unsaved changes when component is being unmounted
  if (hasUnsavedChanges.value) {
    console.warn("⚠️ Profile component unmounted with unsaved changes!");
    console.log(
      "Changes will be preserved in store until user returns or saves."
    );
    // Note: We don't revert here to allow user to return and save changes
  }

  // Clean up pending actions
  if (pendingCloseAction) {
    pendingCloseAction = null;
  }
});

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
