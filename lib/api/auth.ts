import { apiAuth } from "./client";
import { saveTokens, clearTokens, getAccessToken, getRefreshToken } from "../storage/auth";
import { parseApiError } from "../api/error";

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
    const { data } = await apiAuth.post<TokenPayload>("/auth/register", {
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
    const { data } = await apiAuth.post<TokenPayload>("/auth/login", { email, password });
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

export async function getProfile() {
  const { data } = await apiAuth.get("/auth/me");
  return data;
}

export async function logout() {
  try {
    // nhiều API yêu cầu cả access + refresh khi logout
    await apiAuth.post("/auth/logout", {
      refresh_token: await getRefreshToken(),
    }, {
      headers: { Authorization: `Bearer ${await getAccessToken()}` },
    });
  } catch {}
  await clearTokens();
}

// Gửi OTP để đặt lại mật khẩu bằng email đã đăng ký
export async function sendPasswordResetOtp(email: string): Promise<void> {
  try {
    // Backend thường sẽ gửi email OTP nếu email tồn tại
    await apiAuth.post("/auth/forgot-password/request-otp", { email });
  } catch (err: any) {
    // Chuẩn hoá message gọn gàng cho UI
    const message = parseApiError(err);
    throw new Error(message);
  }
}