import { useEffect } from "react";
import { Stack, router } from "expo-router";
import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import { Alert } from "react-native";

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
    initializeApp().then((cleanupFn: () => void) => {
      cleanup = cleanupFn;
    });

    // ✅ Xử lý deep link từ VNPAY ở root level
    const handleDeepLink = async ({ url }: { url: string }) => {
      try {
        const parsed = Linking.parse(url);

        if (
          parsed.path === "payment/result" ||
          url.includes("payment/result")
        ) {
          const params = parsed.queryParams;
          const status = params?.status as string;
          const reservationId = params?.reservation_id as string;
          const monthlyPassId = params?.monthly_pass_id as string;
          const txnRef = params?.txn_ref as string;
          const orderId = params?.order_id as string;

          console.log("🔗 Deep link received:", {
            status,
            reservationId,
            monthlyPassId,
            txnRef,
            orderId,
          });

          const isMonthlyPass = monthlyPassId || (orderId && orderId.startsWith("MP-"));
          
          if (isMonthlyPass) {
            router.replace("/screens/tab/HomeScreen");
            setTimeout(() => {
              router.push("/screens/MonthlyPassScreen");
            }, 100);
          } else if (reservationId) {
            router.replace("/screens/tab/HomeScreen");
            setTimeout(() => {
              router.push("/screens/tab/QRScreen");
            }, 100);
          } else {
            router.replace("/screens/tab/HomeScreen");
          }

          setTimeout(() => {
            if (status === "PAID") {
              if (isMonthlyPass) {
                Alert.alert(
                  "Thanh toán thành công!",
                  "Vé tháng của bạn đã được kích hoạt. Vui lòng kiểm tra trong mục 'Vé tháng'.",
                  [
                    {
                      text: "OK",
                      onPress: () => {},
                    },
                  ]
                );
              } else if (reservationId) {
                Alert.alert(
                  "Thanh toán thành công!",
                  "Cảm ơn bạn đã sử dụng dịch vụ.",
                  [
                    {
                      text: "OK",
                      onPress: () => {},
                    },
                  ]
                );
              } else {
                Alert.alert(
                  "Thanh toán thành công!",
                  "Cảm ơn bạn đã sử dụng dịch vụ.",
                  [
                    {
                      text: "OK",
                      onPress: () => {},
                    },
                  ]
                );
              }
            } else if (status === "FAILED") {
              Alert.alert(
                "Thanh toán thất bại",
                "Vui lòng thử lại hoặc chọn phương thức thanh toán khác.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      if (reservationId) {
                        router.push(
                          `/screens/reservations/PaymentScreen?reservationId=${reservationId}`
                        );
                      } else if (isMonthlyPass) {
                        router.push("/screens/MonthlyPassScreen");
                      }
                    },
                  },
                ]
              );
            }
          }, 800);
        }
      } catch (error) {
        console.error("Error handling deep link:", error);
      }
    };

    // ✅ Lắng nghe deep link khi app được mở từ VNPAY
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // ✅ Kiểm tra URL khi app mở (nếu app đã mở sẵn)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Cleanup listeners khi component unmount
    return () => {
      cleanup?.();
      subscription.remove();
    };
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
