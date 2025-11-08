import {
  getMessaging,
  onMessage,
  onTokenRefresh,
  getToken,
  requestPermission,
} from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Lấy messaging instance
const messaging = getMessaging();

// Cấu hình notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Hiển thị alert
    shouldPlaySound: true, // Phát âm thanh
    shouldSetBadge: true, // Set badge number
    shouldShowBanner: true, // Hiển thị banner notification
    shouldShowList: true, // Hiển thị trong notification list
  }),
});

// Lấy FCM token thuần từ Firebase Messaging
export async function getFCMToken(): Promise<string | null> {
  try {
    if (!messaging) {
      console.error("Firebase Messaging is not available");
      return null;
    }

    // Kiểm tra quyền notification (chỉ iOS cần request permission)
    if (Platform.OS === "ios") {
      const authStatus = await requestPermission(messaging);

      const enabled =
        authStatus === 1 || // AUTHORIZED
        authStatus === 2; // PROVISIONAL

      if (!enabled) {
        return null;
      }
    }

    // Đợi một chút để đảm bảo Firebase đã sẵn sàng
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Lấy FCM token thuần từ Firebase
    const fcmToken = await getToken(messaging);

    if (!fcmToken || fcmToken === "") {
      return null;
    }

    return fcmToken;
  } catch (error: any) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

// Lắng nghe khi FCM token được refresh (token có thể thay đổi)
export function onFCMTokenRefresh(callback: (token: string) => void) {
  return onTokenRefresh(messaging, (token) => {
    callback(token);
  });
}

//  Lắng nghe khi nhận được notification
export function setupNotificationListeners() {
  try {
    // ===== STEP 1: Nhận FCM message khi app ở FOREGROUND =====
    // Khi backend gửi notification, FCM sẽ gọi function này
    const unsubscribeForeground = onMessage(
      messaging,
      async (remoteMessage) => {
        console.log("📬 [FOREGROUND] FCM Message received:", {
          messageId: remoteMessage.messageId,
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          data: remoteMessage.data,
        });

        // FCM không tự hiển thị notification khi app ở foreground
        // Nên chúng ta phải tự hiển thị bằng Expo Notifications
        if (remoteMessage.notification) {
          try {
            // Lấy channel ID cho Android (cần set channel trước)
            let androidChannelId = "default";

            // Tạo hoặc lấy notification channel cho Android
            if (Platform.OS === "android") {
              await Notifications.setNotificationChannelAsync("default", {
                name: "Default",
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#FF231F7C",
                sound: "default",
              });
              androidChannelId = "default";
            }

            // Schedule notification để hiển thị ngay
            const notificationId =
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: remoteMessage.notification.title || "",
                  body: remoteMessage.notification.body || "",
                  data: {
                    ...remoteMessage.data, // Giữ lại data từ FCM
                    messageId: remoteMessage.messageId, // Thêm messageId
                  },
                  sound: "default", // Phát âm thanh mặc định
                  priority: Notifications.AndroidNotificationPriority.HIGH,
                  badge: 1, // Set badge number
                },
                trigger: null, // Hiển thị ngay lập tức
                // Android specific
                ...(Platform.OS === "android" && {
                  android: {
                    channelId: androidChannelId,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    sound: "default",
                    vibrate: [0, 250, 250, 250],
                    sticky: false,
                    autoCancel: true,
                  },
                }),
              });

            console.log(
              "✅ [FOREGROUND] Notification scheduled:",
              notificationId
            );
            console.log("✅ [FOREGROUND] Notification should be visible now");
          } catch (error) {
            console.error(
              "❌ [FOREGROUND] Error displaying notification:",
              error
            );
          }
        }
      }
    );

    // ===== STEP 2: Lắng nghe khi notification được hiển thị =====
    // Listener này nhận notification từ Expo (sau khi schedule)
    // Có thể dùng để update UI, badge count, etc.
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📬 [FOREGROUND] Expo Notification displayed:", {
          identifier: notification.request.identifier,
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
        });

        // Có thể update UI tại đây
        // Ví dụ: Tăng badge count, hiển thị toast, update state, etc.
      }
    );

    // ===== STEP 3: Xử lý khi USER TAP vào notification =====
    // Được gọi khi user tap vào notification banner
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const notification = response.notification;
        const data = notification.request.content.data;

        console.log("👆 [FOREGROUND] User tapped notification:", {
          identifier: notification.request.identifier,
          title: notification.request.content.title,
          data: data,
        });

        // TODO: Xử lý navigation dựa trên data
        // Ví dụ:
        // if (data?.type === 'reservation_hold') {
        //   router.push('/reservations/' + data.reservation_id);
        // }
      });

    // Return cleanup function
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
      unsubscribeForeground();
    };
  } catch (error) {
    console.error("❌ Error setting up notification listeners:", error);
    return () => {}; // Return empty cleanup function
  }
}
