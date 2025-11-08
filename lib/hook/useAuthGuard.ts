import { useEffect } from "react";
import { router } from "expo-router";
import { clearTokens, getAccessToken } from "../storage/auth";
import { getProfile } from "@/lib/api/auth";

export function useAuthGuard() {
  useEffect(() => {
    (async () => {
      const at = await getAccessToken();
      if (!at) {
        router.replace("/screens/auth/LoginScreen");
        return;
      }

      // Verify token bằng cách gọi auth/me
      try {
        await getProfile();
      } catch (error: any) {
        // Token invalid hoặc hết hạn
        console.warn(
          "Auth guard: Token verification failed",
          error?.response?.data || error?.message
        );
        await clearTokens();
        router.replace("/screens/auth/LoginScreen");
      }
    })();
  }, []);
}
