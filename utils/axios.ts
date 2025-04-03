"use client";

import { getCookie, setCookie } from "@/utils/cookies";
import { KeycloakService } from "@/utils/keycloak";
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

interface ErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
}

interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const axiosInstance = axios.create({
  baseURL: "http://10.6.0.20:30216/",
  // baseURL: "https://6r063drr-9000.usw3.devtunnels.ms/",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (process.env.NODE_ENV === "development") {
    }

    const token = getCookie();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    if (process.env.NODE_ENV === "development") {
    }
    return response;
  },
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as CustomInternalAxiosRequestConfig;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const keycloak = KeycloakService.getInstance();

        // Check if keycloak is authenticated first
        if (!keycloak.authenticated) {
          // If not authenticated, redirect to login immediately
          await KeycloakService.login(keycloak);
          return Promise.reject(error);
        }

        // Try to refresh the token
        const refreshed = await keycloak.updateToken(70);

        if (refreshed && keycloak.token) {
          setCookie(keycloak.token);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${keycloak.token}`;
          }

          return axios(originalRequest);
        } else {
          // Token couldn't be refreshed, force login
          await KeycloakService.login(keycloak);
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Force redirect to login on any refresh error
        await KeycloakService.login(KeycloakService.getInstance());
        return Promise.reject(refreshError);
      }
    }

    // Handle other error cases
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An error occurred";

    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", {
        status: error.response?.status,
        message: errorMessage,
        url: originalRequest?.url,
      });
    }

    return Promise.reject(error);
  }
);

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;
    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      "An error occurred"
    );
  }
  return error instanceof Error ? error.message : "An error occurred";
};

export default axiosInstance;
