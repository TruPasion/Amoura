import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { getnearbyhelper } from "../apihelper/geohelper";
import type { User, NearbyUserProfile } from "../utils/types";

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
  }

  function logout() {
    user.value = null;
  }

  //get profile
  async function userProfileAction(action: boolean) {
    if (nearbyUsers.value.length > 0) {
      const currentProfile = nearbyUsers.value[nearbyUsers.value.length - 1];
      try {
        const payload = {
          user_id: user.value?.id,
          seen_user_id: currentProfile.user_id, // Fixed property name
          action: action ? "like" : "dislike",
        };
        await fetch("/api/actions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        console.log(
          `${action ? "Liked" : "Disliked"} profile:`,
          currentProfile
        );
      } catch (error) {
        console.error("Error performing user action:", error);
      }
      if (isRewind.value) {
        isRewind.value = false; // Reset rewind state after action
        nearbyUsers.value.pop()
      } else {
        lastSeenProfile.value = nearbyUsers.value.pop() ?? null;
      }
      if (nearbyUsers.value.length === 0) {
        await getnearbyusers(); // Fetch more users if available
      }
    }
  }

  async function undoUserAction() {
    if (lastSeenProfile.value) {
      try {
        isRewind.value = true;
        const payload = {
          user_id: user.value?.id,
          seen_user_id: lastSeenProfile.value.user_id, // Fixed property name
          action: "rewind",
        };
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

  return {
    user,
    range,
    ageRange,
    gender,
    getnearbyuserPayload,
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
  };
});
