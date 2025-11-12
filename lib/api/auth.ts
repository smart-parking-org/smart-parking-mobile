import { apiAuth } from "./client";
import { saveTokens, clearTokens, getAccessToken } from "../storage/auth";
import { parseApiError } from "../api/error";
import { getFCMToken } from "@/lib/utils/fcm";

type TokenPayload = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

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
      await saveTokens(data.access_token, data.expires_in);
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
    const { data } = await apiAuth.post<TokenPayload>("/auth/login", {
      email,
      password,
    });
    await saveTokens(data.access_token, data.expires_in);

    const fcmToken = await getFCMToken();
    if (fcmToken) {
      updateFcmToken(fcmToken).catch((err) => {
        console.error("Failed to update FCM token after login:", err);
      });
    }
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
    await apiAuth.post("/auth/logout");
  } catch {
  } finally {
    await clearTokens();
  }
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

export async function updateFcmToken(fcmToken: string): Promise<void> {
  try {
    await apiAuth.put("/me/fcm-token", { fcm_token: fcmToken });
    console.log("FCM token updated successfully");
  } catch (err: any) {
    console.error(
      "Error updating FCM token:",
      err?.response?.data || err?.message
    );
  }
}
export async function verifyPasswordResetOtp(
  email: string,
  otp: string
): Promise<{ reset_token: string }> {
  try {
    const { data } = await apiAuth.post<{ reset_token: string }>("/auth/forgot-password/verify-otp", {
      email,
      otp,
    });
    return data;
  } catch (err: any) {
    // Chuẩn hoá message gọn gàng cho UI
    const message = parseApiError(err);
    throw new Error(message);
  }
}
export async function resetPassword(
  email: string,
  reset_token: string,
  password: string
): Promise<void> {
  try {
    await apiAuth.post("/auth/forgot-password/reset", {
      reset_token,
      password,
    });
  } catch (err: any) {
    const message = parseApiError(err);
    throw new Error(message);
  }
}
