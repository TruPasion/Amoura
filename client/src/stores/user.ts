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
  };
});
