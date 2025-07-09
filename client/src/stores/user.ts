import { defineStore } from "pinia";
import { ref } from "vue";

interface UserProfile {
  name: string;
  dateOfBirth: string; // ISO format, e.g., "2003-02-10"
  gender: "Male" | "Female" | "Other";
  photo: Record<string, any>; // or `File | Blob | null` if it's a file upload
  locationAccess: boolean;
  location: {
    latitude: number;
    longitude: number;
  };
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
