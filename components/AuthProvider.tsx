"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import type Keycloak from "keycloak-js";
import { usePathname, useRouter } from "next/navigation";
import { KeycloakService } from "@/utils/keycloak";
import { getCookie, setCookie, removeCookie } from "@/utils/cookies";

interface AuthContextType {
  keycloak: Keycloak | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType>({
  keycloak: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  token: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const initialized = useRef(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === "undefined" || initialized.current) return;

      initialized.current = true;
      const storedToken = getCookie();

      // Check if current route is public
      const isPublicRoute =
        pathname === "/onboard" || pathname.startsWith("/onboard/");

      try {
        const keycloakInstance = KeycloakService.getInstance();
        setKeycloak(keycloakInstance);

        if (storedToken) {
          setToken(storedToken);
          setIsAuthenticated(true);

          const cleanup = KeycloakService.setupTokenRefresh(
            keycloakInstance,
            (newToken) => {
              setToken(newToken);
              setCookie(newToken);
            },
            handleLogout
          );

          setIsLoading(false);
          return cleanup;
        }

        const { authenticated } = await KeycloakService.initKeycloak(
          isPublicRoute
        );
        setIsAuthenticated(authenticated);

        if (authenticated && keycloakInstance.token) {
          setToken(keycloakInstance.token);
          setCookie(keycloakInstance.token);

          const cleanup = KeycloakService.setupTokenRefresh(
            keycloakInstance,
            (newToken) => {
              setToken(newToken);
              setCookie(newToken);
            },
            handleLogout
          );

          if (window.location.search.includes("code=")) {
            router.replace("/");
          }

          return cleanup;
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [pathname, router]);

  const handleLogin = () => {
    if (!keycloak) return;
    KeycloakService.login(keycloak);
  };

  const handleLogout = () => {
    if (!keycloak && isAuthenticated) {
      setIsAuthenticated(false);
      setToken(null);
      removeCookie();

      window.location.href = "/";
      return;
    }

    if (!keycloak) {
      return;
    }

    try {
      initialized.current = false;
      setToken(null);
      setIsAuthenticated(false);
      KeycloakService.logout(keycloak);
    } catch (error) {
      removeCookie();
      window.location.href = "/";
    }
  };

  const value = {
    keycloak,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
