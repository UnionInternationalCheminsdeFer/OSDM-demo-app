import { AccessToken } from '@/auth'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: (): {
    sandboxURL: string
    clientSecret: string
    clientId: string
    accessToken: AccessToken
    authURL: string
    requestorRef: string
  } => ({
    sandboxURL: localStorage.getItem('sandboxURL') ?? '',
    clientSecret: localStorage.getItem('clientSecret') ?? '',
    clientId: localStorage.getItem('clientId') ?? '',
    accessToken: new AccessToken(),
    authURL: localStorage.getItem('authURL') ?? '',
    requestorRef: localStorage.getItem('requestorRef') ?? '',
  }),
  actions: {
    setAccessDetails(
      sandboxURL: string,
      clientId: string,
      clientSecret: string,
      authURL: string,
      requestorRef: string,
    ) {
      this.sandboxURL = sandboxURL
      this.clientSecret = clientSecret
      this.clientId = clientId
      this.authURL = authURL
      this.requestorRef = requestorRef
      localStorage.setItem('sandboxURL', sandboxURL)
      localStorage.setItem('clientSecret', clientSecret)
      localStorage.setItem('clientId', clientId)
      localStorage.setItem('authURL', authURL)
      localStorage.setItem('requestorRef', requestorRef)
    },
  },
})
