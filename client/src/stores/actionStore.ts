import { defineStore } from "pinia";
import type { Match } from "../utils/types";
import { ref } from "vue";

export const useActionStore = defineStore("actionStore", () => {
  const matches = ref<Match[]>([]);
  const openchat = ref(false);
  const chatUser = ref<Match | null>(null);
  const openProfile = ref(false);

  // Navigation confirmation state
  const showNavigationConfirm = ref(false);
  const pendingNavigation = ref<(() => void) | null>(null);

  const openChat = (user: Match | null) => {
    // Check if profile is open and has unsaved changes
    if (openProfile.value) {
      // Import user store dynamically to avoid circular dependency
      import("./user").then(({ useUserStore }) => {
        const userStore = useUserStore();
        if (userStore.hasUnsavedChanges) {
          // Store the pending navigation
          pendingNavigation.value = () => {
            chatUser.value = user;
            openchat.value = true;
            openProfile.value = false;
          };
          showNavigationConfirm.value = true;
          return;
        } else {
          // No unsaved changes, proceed normally
          chatUser.value = user;
          openchat.value = true;
          openProfile.value = false;
        }
      });
    } else {
      // Profile not open, proceed normally
      chatUser.value = user;
      openchat.value = true;
      openProfile.value = false;
    }
  };

  const closeChat = () => {
    chatUser.value = null;
    openchat.value = false;
  };

  const openUserProfile = () => {
    openProfile.value = true;
    openchat.value = false; // Close chat if open
    chatUser.value = null;
    // Cancel any pending navigation when opening profile
    pendingNavigation.value = null;
    showNavigationConfirm.value = false;
  };

  const closeUserProfile = () => {
    openProfile.value = false;
    // Cancel any pending navigation
    pendingNavigation.value = null;
    showNavigationConfirm.value = false;
  };

  // Navigation confirmation actions
  const confirmNavigation = () => {
    if (pendingNavigation.value) {
      pendingNavigation.value();
      pendingNavigation.value = null;
    }
    showNavigationConfirm.value = false;
  };

  const cancelNavigation = () => {
    pendingNavigation.value = null;
    showNavigationConfirm.value = false;
  };

  const discardAndNavigate = () => {
    // Import user store dynamically and revert changes
    import("./user").then(({ useUserStore }) => {
      const userStore = useUserStore();
      userStore.revertToOriginalData();
      confirmNavigation();
    });
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
    showNavigationConfirm,
    pendingNavigation,
    getMatches,
    openChat,
    closeChat,
    openUserProfile,
    closeUserProfile,
    confirmNavigation,
    cancelNavigation,
    discardAndNavigate,
  };
});
