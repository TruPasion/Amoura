import { defineStore } from "pinia";
import type { Match } from "../utils/types";
import { ref } from "vue";

export const useActionStore = defineStore("actionStore", () => {
  const matches = ref<Match[]>([]);

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
    matches,
    getMatches,
  };
});
