<template>
  <div class="h-full flex flex-col">
    <h3
      class="text-xl font-semibold text-gray-800 mb-4 flex items-center flex-shrink-0"
    >
      <Images class="w-6 h-6 mr-2 text-purple-600" />
      Photos
    </h3>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      @change="handleFileSelect"
      class="hidden"
    />

    <!-- 3x3 Photo Grid -->
    <div class="flex-1 min-h-0 overflow-hidden">
      <div class="grid grid-cols-3 gap-2 md:gap-3 lg:gap-4 h-full w-full">
        <!-- Profile Photo (First Slot - Primary photo) -->
        <div class="relative group min-h-0">
          <div
            class="aspect-[4/5] rounded-lg overflow-hidden shadow-md w-full h-auto max-h-full border-2 border-purple-300"
          >
            <img
              :src="
                primaryPhoto?.image_url ||
                user?.profile?.profile_photo?.image_url
              "
              :alt="user?.profile?.full_name || user?.name || 'User'"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <!-- Profile badge -->
            <div
              class="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium"
            >
              Profile
            </div>
          </div>
        </div>

        <!-- Other Photos with Star to Set as Profile -->
        <div
          v-for="(photo, index) in displayPhotos.slice(0, 8)"
          :key="photo.id"
          class="relative group min-h-0"
        >
          <div
            class="aspect-[4/5] rounded-lg overflow-hidden shadow-md w-full h-auto max-h-full"
          >
            <img
              :src="photo.url"
              :alt="`Photo ${index + 1}`"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <!-- Star and Delete icons on hover -->
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-start justify-between p-1 md:p-2"
            >
              <!-- Star to set as profile photo -->
              <button
                @click="setAsProfilePhoto(photo)"
                class="bg-yellow-500 hover:bg-yellow-600 text-white p-1 md:p-1.5 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                title="Set as profile photo"
              >
                <Star class="w-2.5 h-2.5 md:w-3 md:h-3" />
              </button>
              <!-- Delete icon -->
              <button
                @click="removePhoto(photo)"
                class="bg-red-500 hover:bg-red-600 text-white p-1 md:p-1.5 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                title="Delete photo"
              >
                <Trash2 class="w-2.5 h-2.5 md:w-3 md:h-3" />
              </button>
            </div>
          </div>
        </div>

        <!-- Upload slots with + icons -->
        <div
          v-for="n in availableSlots"
          :key="`upload-${n}`"
          @click="triggerFileUpload"
          class="group cursor-pointer min-h-0"
        >
          <div
            class="aspect-[4/5] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:border-purple-400 group-hover:bg-gradient-to-br group-hover:from-purple-50 group-hover:to-pink-50 group-hover:shadow-md w-full h-auto max-h-full"
          >
            <div class="text-center">
              <div
                class="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full bg-gray-100 group-hover:bg-purple-100 transition-all duration-300 flex items-center justify-center mx-auto"
              >
                <Plus
                  class="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-gray-400 group-hover:text-purple-500 transition-colors duration-300"
                />
              </div>
              <p
                class="text-xs text-gray-400 group-hover:text-purple-600 font-medium transition-colors duration-300 hidden lg:block mt-1"
              >
                Add
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Compact Tips -->
    <div
      class="mt-3 p-2 bg-purple-50 rounded-lg border border-purple-100 flex-shrink-0"
    >
      <p class="text-xs text-purple-700 text-center">
        <span class="font-medium">Tip:</span> At least one photo required • Max
        9 photos
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Images, Trash2, Plus, Star } from "lucide-vue-next";
import { useUserStore } from "../../stores/user";
import { storeToRefs } from "pinia";
import type { PhotoObject } from "../../utils/types";

interface DisplayPhoto {
  id: number;
  url: string;
  is_primary: boolean;
  position: number;
  isNew?: boolean;
}

const emit = defineEmits<{
  hasChanges: [hasChanges: boolean];
}>();

const userStore = useUserStore();
const { user, hasUnsavedChanges } = storeToRefs(userStore);

// Watch for changes and emit to parent
watch(
  hasUnsavedChanges,
  (newValue) => {
    emit("hasChanges", newValue);
  },
  { immediate: true }
);

const fileInput = ref<HTMLInputElement>();

// Get primary photo (first photo should be the one with is_primary: true)
const primaryPhoto = computed(() => {
  if (!user.value?.profile?.photos) return null;
  return (
    user.value.profile.photos.find((photo) => photo.is_primary) ||
    user.value.profile.photos[0]
  );
});

// Filter out primary photo from photos array and convert for display
const displayPhotos = computed((): DisplayPhoto[] => {
  if (!user.value?.profile?.photos) return [];

  return user.value.profile.photos
    .filter((photo) => !photo.is_primary) // Filter out primary photo
    .sort((a, b) => a.position - b.position) // Sort by position
    .map((photo) => ({
      id: photo.id,
      url: photo.image_url,
      is_primary: photo.is_primary,
      position: photo.position,
      isNew: photo.id < 0, // Negative IDs indicate new photos
    }));
});

// Calculate available upload slots (max 9 total photos including profile)
const availableSlots = computed(() => {
  return Math.max(0, 8 - displayPhotos.value.length);
});

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (files && files.length > 0) {
    const currentPhotosCount = user.value?.profile?.photos?.length || 0;
    const remainingSlots = 8 - currentPhotosCount; // Max 8 regular photos + 1 profile
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const photoUrl = e.target?.result as string;
          userStore.addPhoto(photoUrl);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Reset file input
  if (target) {
    target.value = "";
  }
};

const removePhoto = (photo: DisplayPhoto) => {
  const photoObject: PhotoObject = {
    id: photo.id,
    image_url: photo.url,
    is_primary: photo.is_primary,
    position: photo.position,
  };
  userStore.removePhoto(photoObject);
};

const setAsProfilePhoto = (photo: DisplayPhoto) => {
  const photoObject: PhotoObject = {
    id: photo.id,
    image_url: photo.url,
    is_primary: true,
    position: 1,
  };
  userStore.updateProfilePhoto(photoObject);
};
</script>

<style scoped>
.border-3 {
  border-width: 3px;
}
</style>
