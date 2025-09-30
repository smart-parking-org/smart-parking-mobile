import { api } from "./client";
import { saveTokens, clearTokens, getAccessToken, getRefreshToken } from "../storage/auth";

type TokenPayload = { access_token: string; refresh_token?: string; expires_in?: number };

export async function register(
  name: string,
  email: string,
  password: string,
  phone: string,
  cccd: string,
  apartment_code: string
) {
  try {
    const { data } = await api.post<TokenPayload>("/auth/register", {
      name,
      email,
      password,
      phone,
      apartment_code,
      cccd,
    });

    if (data.access_token) {
      await saveTokens(data.access_token, data.refresh_token, data.expires_in);
    }

    return data;
  } catch (err: any) {
    console.error("REGISTER ERROR:", err.response?.data || err.message);
    throw err.response?.data || err;
  }
}

// export async function login(email: string, password: string) {
//   const { data } = await api.post<TokenPayload>("/auth/login", { email, password });
//   await saveTokens(data.access_token, data.refresh_token, data.expires_in);
//   return data;
// }
export async function login(email: string, password: string) {
  try {
    const { data } = await api.post<TokenPayload>("/auth/login", { email, password });
    await saveTokens(data.access_token, data.refresh_token, data.expires_in);
    return data;
  } catch (err: any) {
    // log ra console cho dev xem chi tiết
    console.log("LOGIN ERROR:", {
      status: err?.response?.status,
      url: err?.config?.url,
      baseURL: err?.config?.baseURL,
      data: err?.response?.data,
      message: err?.message,
    });

    // ném lỗi với message gọn gàng để UI (Alert) hiển thị
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      "Đăng nhập thất bại";
    throw new Error(msg);
  }
}

export const me = async () => (await api.get("/auth/me")).data;

export async function logout() {
  try {
    // nhiều API yêu cầu cả access + refresh khi logout
    await api.post("/auth/logout", {
      refresh_token: await getRefreshToken(),
    }, {
      headers: { Authorization: `Bearer ${await getAccessToken()}` },
    });
  } catch {}
  await clearTokens();
}
