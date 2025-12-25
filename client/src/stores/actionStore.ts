import { defineStore } from "pinia";
import type { Match } from "../utils/types";
import { ref } from "vue";

export const useActionStore = defineStore("actionStore", () => {
  const matches = ref<Match[]>([]);
  const openchat = ref(false);
  const chatUser = ref<Match | null>(null);
  const openProfile = ref(false);

  const openChat = (user: Match | null) => {
    chatUser.value = user;
    openchat.value = true;
    openProfile.value = false; // Close profile if open
  };

  const closeChat = () => {
    chatUser.value = null;
    openchat.value = false;
  };

  const openUserProfile = () => {
    openProfile.value = true;
    openchat.value = false; // Close chat if open
    chatUser.value = null;
  };

  const closeUserProfile = () => {
    openProfile.value = false;
  };

  const getMatches = async (userId: number) => {
    try {
      const response = await fetch(`/api/actions/matches/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      matches.value = (await response.json()) as Match[];
      console.log("Fetched matches:", matches.value);
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
  };
  // Fetch matches when the store is initialized
  return {
    chatUser,
    matches,
    openProfile,
    getMatches,
    openChat,
    closeChat,
    openUserProfile,
    closeUserProfile,
  };
});
