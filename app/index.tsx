import { useEffect } from "react";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { clearTokens, getAccessToken } from "@/lib/storage/auth";
import { getProfile } from "@/lib/api/auth";

async function verifyToken(): Promise<boolean> {
  try {
    await getProfile();
    return true;
  } catch (error: any) {
    // Token hết hạn hoặc invalid
    console.warn(
      "Token verification failed:",
      error?.response?.data || error?.message
    );
    await clearTokens();
    return false;
  }
}

/**
 * Kiểm tra authentication và điều hướng đến màn hình phù hợp
 */
async function checkAuthenticationAndNavigate(): Promise<void> {
  const token = await getAccessToken();

  if (token) {
    // Verify token bằng cách gọi auth/me
    const isValid = await verifyToken();

    if (isValid) {
      router.replace("/screens/tab/HomeScreen");
    } else {
      // Token invalid hoặc hết hạn → redirect về login
      router.replace("/screens/auth/LoginScreen");
    }
  } else {
    router.replace("/screens/auth/LoginScreen");
  }
}

/**
 * Khởi tạo app: thực hiện các tác vụ khởi tạo và điều hướng
 */
async function initializeApp(): Promise<void> {
  try {
    await checkAuthenticationAndNavigate();
  } catch (error) {
    console.warn("Error during app initialization:", error);
  } finally {
    await SplashScreen.hideAsync();
  }
}

export default function Index() {
  useEffect(() => {
    initializeApp();
  }, []);

  return null;
}
