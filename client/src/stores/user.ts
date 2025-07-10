import { defineStore } from "pinia";
import { ref } from "vue";

interface UserProfile {
  id: number;
  user_id: number;
  full_name: string;
  date_of_birth: string; // ISO 8601 date string
  gender: string;
  latitude: number;
  longitude: number;
  location_access: boolean;
  profile_photo?: string; // Optional, as it's not provided in the example
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
}

interface User {
  id: number;
  email: string;
  name: string;
  profile: UserProfile | null;
}

export const useUserStore = defineStore("user", () => {
  const user = ref<User | null>(null);
  const type = ref<"success" | "danger" | "warning">("success");
  const message = ref<string>("");
  const duration = ref<number>(0); // Default duration for toast messages

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

  return {
    user,
    type,
    message,
    duration,
    setUser,
    logout,
    setMessage,
    resetMessage,
  };
});
