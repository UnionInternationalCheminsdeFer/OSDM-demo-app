import { AccessToken } from '@/auth'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: (): {
    sandboxURL: string,
    clientSecret: string,
    clientId: string,
    accessToken: AccessToken,
    authURL: string
  } => ({
    sandboxURL: localStorage.getItem("sandboxURL") ?? '',
    clientSecret: localStorage.getItem("clientSecret") ?? '',
    clientId: localStorage.getItem("clientId") ?? '',
    accessToken: new AccessToken(),
    authURL: localStorage.getItem("authURL") ?? '',
  }),
  actions: {
    setAccessDetails(sandboxURL: string, clientId: string, clientSecret: string, authURL: string) {
      this.sandboxURL = sandboxURL
      this.clientSecret = clientSecret
      this.clientId = clientId
      this.authURL = authURL
      localStorage.setItem("sandboxURL", sandboxURL);
      localStorage.setItem("clientSecret", clientSecret);
      localStorage.setItem("clientId", clientId);
      localStorage.setItem("authURL", authURL);
    },
  },
})
