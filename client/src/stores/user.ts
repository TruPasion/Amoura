import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as null | {
      name: string
      email: string
      picture: string
    },
  }),
  actions: {
    setUser(user: { name: string; email: string; picture: string }) {
      this.user = user
    },
    logout() {
      this.user = null
    },
  },
})
