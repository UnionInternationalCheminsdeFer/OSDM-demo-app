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
    requestReservationOfferParts: boolean
  } => ({
    sandboxURL: localStorage.getItem('sandboxURL') ?? '',
    clientSecret: localStorage.getItem('clientSecret') ?? '',
    clientId: localStorage.getItem('clientId') ?? '',
    accessToken: new AccessToken(),
    authURL: localStorage.getItem('authURL') ?? '',
    requestorRef: localStorage.getItem('requestorRef') ?? '',
    requestReservationOfferParts: localStorage.getItem('requestReservationOfferParts') === 'true',
  }),
  actions: {
    setAccessDetails(
      sandboxURL: string,
      clientId: string,
      clientSecret: string,
      authURL: string,
      requestorRef: string,
      requestReservationOfferParts: boolean,
    ) {
      this.sandboxURL = sandboxURL
      this.clientSecret = clientSecret
      this.clientId = clientId
      this.authURL = authURL
      this.requestorRef = requestorRef
      this.requestReservationOfferParts = requestReservationOfferParts
      localStorage.setItem('sandboxURL', sandboxURL)
      localStorage.setItem('clientSecret', clientSecret)
      localStorage.setItem('clientId', clientId)
      localStorage.setItem('authURL', authURL)
      localStorage.setItem('requestorRef', requestorRef)
      localStorage.setItem('requestReservationOfferParts', String(requestReservationOfferParts))
    },
  },
})
