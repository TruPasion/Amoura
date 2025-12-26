import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { getnearbyhelper } from "../apihelper/geohelper";
import type { User, NearbyUserProfile, PhotoObject } from "../utils/types";

export const useUserStore = defineStore("user", () => {
  const user = ref<User | null>(null);
  const nearbyUsers = ref<NearbyUserProfile[]>([]);
  const lastSeenProfile = ref<NearbyUserProfile | null>(null);
  const type = ref<"success" | "danger" | "warning">("success");
  const message = ref<string>("");
  const duration = ref<number>(0); // Default duration for toast messages
  const range = ref(50);
  const gender = ref("");
  const ageRange = ref({ min: 18, max: 40 });
  const isRewind = ref(false);

  // Change tracking
  const originalData = ref<{
    profile_photo: PhotoObject | null;
    photos: PhotoObject[];
    profile_fields: {
      bio: string | null;
      job_title: string | null;
      company: string | null;
      education: string | null;
      height_cm: number | null;
      drinking_id: number | null;
      smoking_id: number | null;
      exercise_id: number | null;
      interests: number[];
    };
  } | null>(null);

  const profileChanges = ref<{
    profile_photo_changed: boolean;
    added_photos: PhotoObject[];
    deleted_photos: PhotoObject[];
    profile_fields_changed: boolean;
    field_changes: {
      bio?: string | null;
      job_title?: string | null;
      company?: string | null;
      education?: string | null;
      height_cm?: number | null;
      drinking_id?: number | null;
      smoking_id?: number | null;
      exercise_id?: number | null;
      interests?: number[];
    };
  }>({
    profile_photo_changed: false,
    added_photos: [],
    deleted_photos: [],
    profile_fields_changed: false,
    field_changes: {},
  });

  // Counter for generating unique IDs for new photos
  let nextPhotoId = ref(-1); // Start with negative numbers for new photos

  const hasUnsavedChanges = computed(() => {
    return (
      profileChanges.value.profile_photo_changed ||
      profileChanges.value.added_photos.length > 0 ||
      profileChanges.value.deleted_photos.length > 0 ||
      profileChanges.value.profile_fields_changed
    );
  });

  function addToAccumulatedPayload(newItem: {
    user_id: number | undefined;
    seen_user_id: number | undefined;
    action: string;
  }) {
    const isDuplicate = accumulatedPayload.value.some(
      (item) =>
        item.user_id === newItem.user_id &&
        item.seen_user_id === newItem.seen_user_id &&
        item.action === newItem.action
    );

    if (!isDuplicate) {
      accumulatedPayload.value.push(newItem);
    } else {
      console.log("Skipping duplicate payload:", newItem);
    }
  }

  const getnearbyuserPayload = computed(() => ({
    latitude: user.value?.profile?.latitude || 0,
    longitude: user.value?.profile?.longitude || 0,
    range: range.value * 1000, // Convert km to meters
    gender: gender.value,
    minAge: ageRange.value.min,
    maxAge: ageRange.value.max,
    currentUserId: user.value?.id || 0,
  }));

  async function getnearbyusers() {
    const nearbyusersresponse: NearbyUserProfile[] = await getnearbyhelper(
      getnearbyuserPayload.value
    );
    nearbyUsers.value = nearbyusersresponse || [];
    return nearbyUsers.value;
  }

  function setMessage(
    msg: string,
    msgType: "success" | "danger" | "warning",
    msgDuration: number = 3000
  ) {
    message.value = msg;
    type.value = msgType;
    duration.value = msgDuration;
  }

  function resetMessage() {
    message.value = "";
    type.value = "success"; // Reset to default type
    duration.value = 0; // Reset to default duration
  }

  function setUser(u: User) {
    console.log("Setting user:", u);
    user.value = u;

    // Initialize original data for change tracking
    if (u?.profile) {
      originalData.value = {
        profile_photo: u.profile.profile_photo
          ? { ...u.profile.profile_photo }
          : null,
        photos: u.profile.photos
          ? u.profile.photos.map((photo) => ({ ...photo }))
          : [],
        profile_fields: {
          bio: u.profile.bio,
          job_title: u.profile.job_title,
          company: u.profile.company,
          education: u.profile.education,
          height_cm: u.profile.height_cm,
          drinking_id: u.profile.drinking_id,
          smoking_id: u.profile.smoking_id,
          exercise_id: u.profile.exercise_id,
          interests: [...(u.profile.interests || [])],
        },
      };
    }

    // Reset changes
    resetChanges();
  }

  function logout() {
    user.value = null;
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const accumulatedPayload = ref<any[]>([]);

  async function userProfileAction(action: boolean) {
    if (nearbyUsers.value.length > 0) {
      const currentProfile = nearbyUsers.value[nearbyUsers.value.length - 1];

      // Accumulate payload
      addToAccumulatedPayload({
        user_id: user.value?.id,
        seen_user_id: currentProfile.user_id,
        action: action ? "like" : "dislike",
      });

      // Handle UI state immediately
      if (isRewind.value) {
        isRewind.value = false;
        nearbyUsers.value.pop();
      } else {
        lastSeenProfile.value = nearbyUsers.value.pop() ?? null;
      }

      // Reset debounce timer on each call
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(async () => {
        if (accumulatedPayload.value.length > 0) {
          const payloadToSend = [...accumulatedPayload.value];
          accumulatedPayload.value = []; // Clear for next batch

          try {
            await fetch("/api/actions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payloadToSend),
            });

            if (nearbyUsers.value.length === 0) {
              getnearbyusers();
            }
          } catch (error) {
            console.error("Error performing batched user actions:", error);
            accumulatedPayload.value.unshift(...payloadToSend); // Re-add if failed (optional)
          }
        }
      }, 300); // 500ms debounce delay
    }
  }

  //flush function

  async function flush() {
    if (accumulatedPayload.value.length > 0) {
      const payloadToSend = [...accumulatedPayload.value];
      accumulatedPayload.value = [];

      try {
        await fetch("/api/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadToSend),
          keepalive: true,
        });
        if (nearbyUsers.value.length === 0) {
          getnearbyusers();
        }
      } catch (error) {
        console.error("Failed to flush batched actions on unload:", error);
      }
    }
  }

  async function undoUserAction() {
    if (lastSeenProfile.value) {
      try {
        isRewind.value = true;
        const payload = [
          {
            user_id: user.value?.id,
            seen_user_id: lastSeenProfile.value.user_id, // Fixed property name
            action: "rewind",
          },
        ];
        await fetch("/api/actions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        nearbyUsers.value.push(lastSeenProfile.value);
        lastSeenProfile.value = null; // Clear the last seen profile
        console.log("Rewind action completed successfully");
      } catch (error) {
        console.error("Error performing rewind action:", error);
      }
    } else {
      console.warn("No last seen profile to undo action for.");
      // Disable button in future
    }
  }

  function updateProfilePhoto(photoObject: PhotoObject) {
    if (user.value?.profile) {
      // Update the profile photo
      user.value.profile.profile_photo = {
        ...photoObject,
        is_primary: true,
        position: 1,
      };

      // Update the photos array - mark old primary as false and new as true
      if (user.value.profile.photos) {
        user.value.profile.photos = user.value.profile.photos.map((photo) => ({
          ...photo,
          is_primary: photo.id === photoObject.id,
        }));
      }

      // Track change
      if (originalData.value) {
        const originalProfilePhoto = originalData.value.profile_photo;
        profileChanges.value.profile_photo_changed =
          !originalProfilePhoto || originalProfilePhoto.id !== photoObject.id;
      }
    }
  }

  function updatePhotos(photos: PhotoObject[]) {
    if (user.value?.profile) {
      user.value.profile.photos = photos;
    }
  }

  function addPhoto(photoUrl: string) {
    if (user.value?.profile) {
      if (!user.value.profile.photos) {
        user.value.profile.photos = [];
      }

      // Create new photo object with unique negative ID
      const newPhoto: PhotoObject = {
        id: nextPhotoId.value--,
        image_url: photoUrl,
        is_primary:
          user.value.profile.photos.length === 0 &&
          !user.value.profile.profile_photo,
        position: user.value.profile.photos.length + 1,
      };

      user.value.profile.photos.push(newPhoto);

      // Track change - only add to added_photos if not originally in the data
      if (originalData.value) {
        const wasOriginal = originalData.value.photos.some(
          (photo) => photo.image_url === photoUrl
        );
        if (!wasOriginal) {
          // Check if already in added_photos
          const alreadyAdded = profileChanges.value.added_photos.some(
            (photo) => photo.image_url === photoUrl
          );
          if (!alreadyAdded) {
            profileChanges.value.added_photos.push(newPhoto);
          }
        }

        // Remove from deleted if it was there
        const deletedIndex = profileChanges.value.deleted_photos.findIndex(
          (photo) => photo.image_url === photoUrl
        );
        if (deletedIndex > -1) {
          profileChanges.value.deleted_photos.splice(deletedIndex, 1);
        }
      }
    }
  }

  function removePhoto(photoObject: PhotoObject) {
    if (user.value?.profile?.photos) {
      const index = user.value.profile.photos.findIndex(
        (photo) => photo.id === photoObject.id
      );
      if (index > -1) {
        const removedPhoto = user.value.profile.photos[index];
        user.value.profile.photos.splice(index, 1);

        // Track change
        if (originalData.value) {
          const wasOriginal = originalData.value.photos.some(
            (photo) => photo.id === photoObject.id && photo.id > 0
          );

          if (wasOriginal) {
            // Only add to deleted_photos if it was an original photo (positive ID)
            const alreadyDeleted = profileChanges.value.deleted_photos.some(
              (photo) => photo.id === photoObject.id
            );
            if (!alreadyDeleted) {
              profileChanges.value.deleted_photos.push(removedPhoto);
            }
          }

          // Remove from added if it was there (for newly added photos that are being removed)
          const addedIndex = profileChanges.value.added_photos.findIndex(
            (photo) => photo.id === photoObject.id
          );
          if (addedIndex > -1) {
            profileChanges.value.added_photos.splice(addedIndex, 1);
          }
        }
      }
    }
  }

  function resetChanges() {
    profileChanges.value = {
      profile_photo_changed: false,
      added_photos: [],
      deleted_photos: [],
      profile_fields_changed: false,
      field_changes: {},
    };
  }

  function revertToOriginalData() {
    if (originalData.value && user.value?.profile) {
      // Revert profile photo
      user.value.profile.profile_photo = originalData.value.profile_photo
        ? { ...originalData.value.profile_photo }
        : undefined;

      // Revert photos array
      user.value.profile.photos = originalData.value.photos.map((photo) => ({
        ...photo,
      }));

      // Revert profile fields
      const fields = originalData.value.profile_fields;
      user.value.profile.bio = fields.bio;
      user.value.profile.job_title = fields.job_title;
      user.value.profile.company = fields.company;
      user.value.profile.education = fields.education;
      user.value.profile.height_cm = fields.height_cm;
      user.value.profile.drinking_id = fields.drinking_id;
      user.value.profile.smoking_id = fields.smoking_id;
      user.value.profile.exercise_id = fields.exercise_id;
      user.value.profile.interests = [...fields.interests];

      // Reset change tracking
      resetChanges();

      console.log("✅ Profile reverted to original state");
    }
  }

  function saveProfileChanges() {
    const delta = {
      profile_photo_change: profileChanges.value.profile_photo_changed
        ? user.value?.profile?.profile_photo
        : null,
      added_photos: [...profileChanges.value.added_photos],
      deleted_photos: [...profileChanges.value.deleted_photos],
    };

    console.log("=== Profile Changes Delta ===");
    console.log(
      "Profile photo changed:",
      profileChanges.value.profile_photo_changed
    );
    if (profileChanges.value.profile_photo_changed) {
      console.log("New profile photo:", user.value?.profile?.profile_photo);
    }
    console.log(
      "Added photos count:",
      profileChanges.value.added_photos.length
    );
    console.log("Added photos:", profileChanges.value.added_photos);
    console.log(
      "Deleted photos count:",
      profileChanges.value.deleted_photos.length
    );
    console.log("Deleted photos:", profileChanges.value.deleted_photos);
    console.log("Full delta object:", delta);
    console.log("=============================");

    // TODO: Call API with delta
    // After successful API call:
    // updateOriginalData();
    // resetChanges();

    return delta;
  }

  function updateOriginalData() {
    if (user.value?.profile) {
      originalData.value = {
        profile_photo: user.value.profile.profile_photo
          ? { ...user.value.profile.profile_photo }
          : null,
        photos: user.value.profile.photos
          ? user.value.profile.photos.map((photo) => ({ ...photo }))
          : [],
        profile_fields: {
          bio: user.value.profile.bio,
          job_title: user.value.profile.job_title,
          company: user.value.profile.company,
          education: user.value.profile.education,
          height_cm: user.value.profile.height_cm,
          drinking_id: user.value.profile.drinking_id,
          smoking_id: user.value.profile.smoking_id,
          exercise_id: user.value.profile.exercise_id,
          interests: [...(user.value.profile.interests || [])],
        },
      };
    }
  }

  // Profile field update functions
  function updateProfileField(
    field: keyof NonNullable<typeof originalData.value>['profile_fields'],
    value: any
  ) {
    if (!user.value?.profile || !originalData.value?.profile_fields) return;

    const originalValue = originalData.value.profile_fields[field];

    // Update the profile field
    (user.value.profile as any)[field] = value;

    // Track changes
    if (JSON.stringify(value) !== JSON.stringify(originalValue)) {
      (profileChanges.value.field_changes as any)[field] = value;
      profileChanges.value.profile_fields_changed = true;
    } else {
      // Remove from changes if reverted to original
      delete (profileChanges.value.field_changes as any)[field];
      profileChanges.value.profile_fields_changed =
        Object.keys(profileChanges.value.field_changes).length > 0;
    }

    console.log(`📝 Profile field '${field}' updated:`, value);
    console.log("📊 Current changes:", profileChanges.value.field_changes);
  }

  function updateProfileInterests(interests: number[]) {
    if (!user.value?.profile || !originalData.value?.profile_fields) return;

    const originalInterests = originalData.value.profile_fields.interests;

    // Update interests
    user.value.profile.interests = [...interests];

    // Track changes
    if (
      JSON.stringify(interests.sort()) !==
      JSON.stringify(originalInterests.sort())
    ) {
      profileChanges.value.field_changes.interests = interests;
      profileChanges.value.profile_fields_changed = true;
    } else {
      // Remove from changes if reverted to original
      delete profileChanges.value.field_changes.interests;
      profileChanges.value.profile_fields_changed =
        Object.keys(profileChanges.value.field_changes).length > 0;
    }

    console.log("🌟 Interests updated:", interests);
  }

  return {
    user,
    range,
    ageRange,
    gender,
    getnearbyuserPayload,
    accumulatedPayload,
    type,
    message,
    duration,
    nearbyUsers,
    lastSeenProfile,
    setUser,
    logout,
    setMessage,
    resetMessage,
    getnearbyusers,
    userProfileAction,
    undoUserAction,
    flush,
    updateProfilePhoto,
    updatePhotos,
    addPhoto,
    removePhoto,
    hasUnsavedChanges,
    profileChanges,
    resetChanges,
    revertToOriginalData,
    saveProfileChanges,
    updateOriginalData,
    updateProfileField,
    updateProfileInterests,
    nextPhotoId,
  };
});
