import { useEffect } from "react";
import { Stack } from "expo-router";
import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";

import { setupNotificationListeners } from "@/lib/utils/fcm";
import "../global.css";

// Đăng ký background handler ở top-level
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("Message handled in the background!", remoteMessage);
});

/**
 * Đảm bảo quyền notification được cấp phép
 */
async function ensureNotificationPermissions(): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();

  if (status !== "granted") {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();

    if (newStatus !== "granted") {
      console.warn("Notification permission not granted");
    }
  }
}

/**
 * Khởi tạo các services và listeners khi app khởi động
 */
async function initializeApp(): Promise<() => void> {
  // Ngăn splash screen tự động ẩn
  SplashScreen.preventAutoHideAsync();

  // Đảm bảo quyền notification được grant
  await ensureNotificationPermissions();

  // Setup notification listeners khi app khởi động
  return setupNotificationListeners();
}

export default function Root() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    // Khởi tạo app và lưu cleanup function
    initializeApp().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    // Cleanup listeners khi component unmount
    return () => {
      cleanup?.();
    };
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
