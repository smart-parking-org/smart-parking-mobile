import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_AUTH_URL, API_PAYMENT_URL } from "../../constants/env";
import {
  getAccessToken,
  getRefreshToken,
  getAccessExp,
  saveTokens,
  clearTokens,
} from "../storage/auth";

// ------------ TẠO INTERCEPTOR HELPER ------------
function createAuthInterceptor(instance: any) {
  instance.interceptors.request.use(async (cfg: InternalAxiosRequestConfig & { __retry?: boolean }) => {
    // Nếu access token sắp hết hạn (< 30s) thì chủ động refresh trước khi gửi
    const exp = await getAccessExp();
    if (exp && exp - Math.floor(Date.now() / 1000) < 30) {
      await doRefresh(); // im lặng, không throw (nếu fail sẽ để 401 xử lý)
    }

    const at = await getAccessToken();
    if (at) {
      cfg.headers = cfg.headers ?? {};
      cfg.headers.Authorization = `Bearer ${at}`;
    }
    return cfg;
  });

  instance.interceptors.response.use(
    (r: any) => r,
    async (error: AxiosError & { config?: any }) => {
      const { response, config } = error;
      if (response?.status === 401 && config && !config.__retry) {
        config.__retry = true;

        const newAT = await doRefresh();
        if (newAT) {
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${newAT}`;
          return instance(config); // retry request cũ
        }
      }
      return Promise.reject(error);
    }
  );
}

// ------------ ĐẢM BẢO CHỈ REFRESH 1 LẦN TẠI MỌI THỜI ĐIỂM ------------
let refreshingPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  if (refreshingPromise) return refreshingPromise;

  refreshingPromise = (async () => {
    try {
      const rt = await getRefreshToken();
      if (!rt) return null;

      // Bỏ /api vì baseURL đã có
      const { data } = await axios.post(
        `${API_AUTH_URL}/auth/refresh`, // Chỉ cần /auth/refresh
        { refresh_token: rt },
        { timeout: 12000 }
      );
      await saveTokens(data.access_token, data.refresh_token, data.expires_in);
      return data.access_token as string;
    } catch {
      await clearTokens();
      return null;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
}

// ------------ TẠO 2 INSTANCES ------------
// API Auth (port 8001): auth, vehicles
export const apiAuth = axios.create({
  baseURL: API_AUTH_URL,
  timeout: 15000,
});

// API Payment (port 8002): payment, reservations, parking-lots, parking-slots
export const apiPayment = axios.create({
  baseURL: API_PAYMENT_URL,
  timeout: 15000,
});

// Gắn interceptors cho cả 2
createAuthInterceptor(apiAuth);
createAuthInterceptor(apiPayment);

// Export api mặc định là apiAuth (cho backward compatibility)
export const api = apiAuth;