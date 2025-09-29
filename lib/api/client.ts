// app/api/client.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = "http://10.0.2.2:8000/api"; // Android Emulator
// iOS sim: http://127.0.0.1:8000/api
// Device thật: https://xxxxx.ngrok.io/api

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

// Interceptor thêm token
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor xử lý refresh token
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        if (!refreshToken) throw error;

        // gọi API refresh
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = res.data;
        await AsyncStorage.setItem("access_token", access_token);

        // gắn lại token rồi retry request
        error.config.headers.Authorization = `Bearer ${access_token}`;
        return client(error.config);
      } catch (e) {
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default client;
