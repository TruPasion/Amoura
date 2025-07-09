import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as null | {
      id: number
      email: string
      name: string
    },
  }),
  actions: {
    setUser(user: { id: number; email: string; name: string }) {
      this.user = user
    },
    logout() {
      this.user = null
    },
  },
})
