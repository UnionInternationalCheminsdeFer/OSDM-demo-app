import type { Middleware } from 'openapi-fetch'
import { useAuthStore } from './stores/auth'

export class AccessToken {
  token: string | null
  tokenType: string | null
  tokenExpiration: number | null
  acceptableRequestors: string[] = ["helykozponttechnikai"]
  requestors: string[] | null

  constructor() {
    this.token = null
    this.tokenType = null
    this.tokenExpiration = null
    this.requestors = null
  }

  requestorsAcceptable(): boolean {
    for (const requestor of this.requestors ?? []) {
      if (this.acceptableRequestors.includes(requestor)) {
        return true;
      }
    }
    return false;
  }

  async get() {
    if (!useAuthStore().clientId && !useAuthStore().clientSecret) {
      return;
    }
    if (!this.token || !this.tokenExpiration || this.tokenExpiration <= Date.now()) {
      await this.refresh()
    }
    console.log("Requestors acceptable:", this.requestorsAcceptable());
    console.log("Current requestors:", this.requestors?.toString());
    return `${this.tokenType} ${this.token}`
  }

  async refresh() {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', useAuthStore().clientId);
    formData.append('client_secret', useAuthStore().clientSecret);
    formData.append('scope', 'openid');

    const response = await fetch(
      `${useAuthStore().authURL}/realms/osdm/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    const data = await response.json();

    if (!data.access_token || !data.token_type || !data.expires_in) {
      this.token = null;
      this.tokenType = null;
      this.tokenExpiration = null;

      this.requestors = null
    } else {
      this.token = data.access_token;
      this.tokenType = data.token_type;
      this.tokenExpiration = Date.now() + data.expires_in * 1000; // Convert expires_in (seconds) to milliseconds

      // requestor test
      this.requestors = data.requestor_ref
    }
  }
  
}

export const AuthMiddleware: Middleware = {
  async onRequest({ request }) {
    // Check if accessToken is present
    if (useAuthStore().sandboxURL.length <= 0) {
        return request
    }

    const accessToken = await useAuthStore().accessToken.get();

    if (accessToken) {
      request.headers.set(
          'Authorization',
          accessToken
      )
    }

    return request
  },
}
