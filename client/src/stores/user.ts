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
      const nearbyusersresponse: NearbyUserProfile[] =  await getnearbyhelper(getnearbyuserPayload.value);
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
  function userProfileAction() {
    if(nearbyUsers.value.length > 0) {
      // call api call and do action based on the argument like or dislike 
      lastSeenProfile.value = nearbyUsers.value.pop() ?? null;
    }
  }

  function undoUserAction() {
    if (lastSeenProfile.value) {
      // Re-add the last seen profile back to the nearby users list
      nearbyUsers.value.push(lastSeenProfile.value);
      lastSeenProfile.value = null; // Clear the last seen profile
    }
    else {
      console.warn("No last seen profile to undo action for.");
      // diable button in future
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
    setUser,
    logout,
    setMessage,
    resetMessage,
    getnearbyusers,
    userProfileAction,
    undoUserAction,
  };
});
