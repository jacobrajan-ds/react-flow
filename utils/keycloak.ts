import Keycloak, { KeycloakConfig, KeycloakInitOptions } from "keycloak-js";
import { setCookie, removeCookie, getCookie } from "./cookies";
import {
  NEXT_PUBLIC_KEYCLOAK_REALM,
  NEXT_PUBLIC_KEYCLOAK_URL,
  NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
} from "@/const";

const keycloakConfig: KeycloakConfig = {
  url: NEXT_PUBLIC_KEYCLOAK_URL,
  realm: NEXT_PUBLIC_KEYCLOAK_REALM,
  clientId: NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
};

export class KeycloakService {
  private static instance: Keycloak | null = null;
  private static initPromise: Promise<{
    keycloak: Keycloak;
    authenticated: boolean;
  }> | null = null;

  static getInstance(): Keycloak {
    if (!KeycloakService.instance) {
      KeycloakService.instance = new Keycloak(keycloakConfig);
    }
    return KeycloakService.instance;
  }

  static async initKeycloak(isPublicRoute = false): Promise<{
    keycloak: Keycloak;
    authenticated: boolean;
  }> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      const keycloak = this.getInstance();

      try {
        const initOptions: KeycloakInitOptions = {
          checkLoginIframe: false,
          token: getCookie(),
        };

        // Only require login for protected routes
        if (!isPublicRoute) {
          initOptions.onLoad = "login-required";
        } else {
          initOptions.onLoad = "check-sso";
        }

        const authenticated = await keycloak.init(initOptions);

        if (authenticated && keycloak.token) {
          setCookie(keycloak.token);
        }

        return { keycloak, authenticated };
      } catch (error) {
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  static setupTokenRefresh(
    keycloak: Keycloak,
    onTokenUpdate: (token: string) => void,
    onLogout: () => void
  ): () => void {
    if (typeof window === "undefined") return () => {};

    if ((window as any).tokenRefreshInterval) {
      clearInterval((window as any).tokenRefreshInterval);
    }

    const refreshInterval = setInterval(async () => {
      try {
        const refreshed = await keycloak.updateToken(70);
        if (refreshed && keycloak.token) {
          setCookie(keycloak.token);
          onTokenUpdate(keycloak.token);
        }
      } catch (error) {
        clearInterval(refreshInterval);
        removeCookie();
        onLogout();
      }
    }, 60000);

    (window as any).tokenRefreshInterval = refreshInterval;

    return () => {
      clearInterval(refreshInterval);
      delete (window as any).tokenRefreshInterval;
    };
  }

  static async login(keycloak: Keycloak): Promise<void> {
    try {
      removeCookie();

      const loginUrl = await keycloak.createLoginUrl({
        redirectUri: window.location.origin,
      });
      window.location.href = loginUrl;
    } catch (error) {
      window.location.href = `${NEXT_PUBLIC_KEYCLOAK_URL}/realms/${NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/auth?client_id=${NEXT_PUBLIC_KEYCLOAK_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        window.location.origin
      )}&response_type=code`;
      throw error;
    }
  }

  static async logout(keycloak: Keycloak): Promise<void> {
    try {
      removeCookie();
      this.initPromise = null;
      const logoutUrl = keycloak.createLogoutUrl({
        redirectUri: window.location.origin,
      });
      const enhancedLogoutUrl = `${logoutUrl}&kc_action=logout`;

      window.location.href = enhancedLogoutUrl;
    } catch (error) {
      console.error("Logout error:", error);

      try {
        const fallbackLogoutUrl = `${NEXT_PUBLIC_KEYCLOAK_URL}/realms/${NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(
          window.location.origin
        )}&kc_action=logout`;
        window.location.href = fallbackLogoutUrl;
      } catch (fallbackError) {
        removeCookie();
        window.location.href = "/auth/login";
      }
    }
  }
}
