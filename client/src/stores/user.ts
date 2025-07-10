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

  function setUser(u: User) {
    console.log("Setting user:", u);
    user.value = u;
  }

  function logout() {
    user.value = null;
  }

  return {
    user,
    setUser,
    logout,
  };
});
