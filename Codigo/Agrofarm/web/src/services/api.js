import axios from "axios";
import { useAuthStore } from "../store/authStore.js";
import { isAuthPublicPath } from "../routes/routeAccess.js";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3333/api";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url ?? "");

    const path = window.location.pathname;
    const emRotaPublicaAuth = isAuthPublicPath(path);

    if (status === 401 && !url.includes("/auth/login") && !emRotaPublicaAuth) {
      useAuthStore.getState().clearSession();
      if (!path.startsWith("/login")) {
        window.location.assign("/login");
      }
    }

    if (status === 403 && url.includes("/auth/me")) {
      useAuthStore.getState().clearSession();
      if (!path.startsWith("/login")) {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);
