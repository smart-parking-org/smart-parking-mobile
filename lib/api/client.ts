import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_URL } from "../../constants/env";
import {
  getAccessToken,
  getRefreshToken,
  getAccessExp,
  saveTokens,
  clearTokens,
} from "../storage/auth";

// ------------ TẠO INSTANCE ------------
export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// ------------ GẮN ACCESS TOKEN CHO MỌI REQUEST ------------
api.interceptors.request.use(async (cfg: InternalAxiosRequestConfig & { __retry?: boolean }) => {
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

// ------------ ĐẢM BẢO CHỈ REFRESH 1 LẦN TẠI MỌI THỜI ĐIỂM ------------
let refreshingPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  if (refreshingPromise) return refreshingPromise;

  refreshingPromise = (async () => {
    try {
      const rt = await getRefreshToken();
      if (!rt) return null;

      // Swagger của bạn yêu cầu gửi refresh_token trong BODY:
      const { data } = await axios.post(
        `${API_URL}/auth/refresh`,
        { refresh_token: rt },
        { timeout: 12000 }
      );
      // data: { access_token, refresh_token, expires_in, ... }
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

// ------------ TỰ ĐỘNG REFRESH KHI GẶP 401 ------------
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError & { config?: any }) => {
    const { response, config } = error;
    if (response?.status === 401 && config && !config.__retry) {
      config.__retry = true;

      const newAT = await doRefresh();
      if (newAT) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${newAT}`;
        return api(config); // retry request cũ
      }
    }
    return Promise.reject(error);
  }
);
