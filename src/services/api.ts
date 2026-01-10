import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * CHANGE THIS to your Django server IP or domain
 *
 * Examples:
 *  Local Docker (LAN): http://192.168.1.10:8000/api
 *  Localhost Android Emulator: http://10.0.2.2:8000/api
 *  Production: https://api.pandityatra.com/api
 */
const API_BASE_URL = "http://192.168.1.83:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Attach JWT token to every request
 */
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Auto refresh JWT when expired
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refresh = await AsyncStorage.getItem("refresh_token");

        if (!refresh) throw new Error("No refresh token");

        const res = await axios.post(
          `${API_BASE_URL.replace("/api", "")}/api/token/refresh/`,
          { refresh }
        );

        await AsyncStorage.setItem("access_token", res.data.access);

        original.headers.Authorization = `Bearer ${res.data.access}`;
        return api(original);
      } catch (err) {
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
      }
    }

    return Promise.reject(error);
  }
);

export default api;