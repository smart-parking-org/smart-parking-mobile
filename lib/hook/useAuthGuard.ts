import { useEffect } from "react";
import { router } from "expo-router";
import { getAccessToken } from "../storage/auth";

export function useAuthGuard() {
  useEffect(() => {
    (async () => {
      const at = await getAccessToken();
      if (!at) router.replace("/screens/auth/LoginScreen");
    })();
  }, []);
}
