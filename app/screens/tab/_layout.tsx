import { router, Tabs, useFocusEffect, useSegments } from "expo-router";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { AppColor } from "@/lib/utils/color";
import { useCallback, useEffect, useRef, useState } from "react";
import { getNotifications } from "@/lib/api/notifications";
import { getProfile } from "@/lib/api/auth";

const INACTIVE = "#99a1af"; // xám nhạt
// const ACTIVE = "#155dfc"; // xanh nhạt
const ACTIVE = AppColor.PRIMARY; // xanh nhạt

export default function TabLayout() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<number | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hàm fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await getNotifications({
        user_id: userId,
        per_page: 1, // Chỉ cần lấy 1 để lấy unread_count
      });
      
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [userId]);

  // Lấy user ID và kiểm tra role khi component mount
  useEffect(() => {
    (async () => {
      try {
        const user = await getProfile();
        const userData = user?.data || user;
        const currentUserId = userData?.id;
        const role = userData?.role?.toLowerCase?.();

        if (currentUserId) {
          setUserId(currentUserId);
        }

        if (role === "staff") {
          setIsStaff(true);
          router.replace("/screens/staff/SendNotificationScreen");
        }
      } catch (error) {
        console.error("Error getting user profile:", error);
      } finally {
        setCheckingRole(false);
      }
    })();
  }, []);

   // Fetch unread count khi có userId
   useEffect(() => {
    if (userId) {
      fetchUnreadCount();
    }
  }, [userId, fetchUnreadCount]);

  // Tự động refresh mỗi 30 giây
  useEffect(() => {
    if (userId) {
      // Clear interval cũ nếu có
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set interval mới
      intervalRef.current = setInterval(() => {
        fetchUnreadCount();
      }, 30000); // 30 giây

      // Cleanup khi unmount hoặc userId thay đổi
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [userId, fetchUnreadCount]);

  // Refresh khi tab được focus (khi quay lại từ màn hình khác)
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchUnreadCount();
      }
    }, [userId, fetchUnreadCount])
  );

  if (checkingRole || isStaff) {
    return null;
  }

  return (
    <Tabs
      initialRouteName="HomeScreen" // khớp tên file HomeScreen.tsx
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: AppColor.PRIMARY },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "800", fontSize: 16, color: "#fff" },
        headerTintColor: "#fff",
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.push("/screens/tab/HomeScreen")}
          >
            <Image
              source={require("@/assets/logo-white.png")}
              style={{
                width: 35,
                height: 35,
                marginLeft: 12,
                objectFit: "contain",
              }}
            />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push("/screens/NotificationScreen")}
            style={{ marginRight: 16 }}
          >
            <View>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    backgroundColor: AppColor.DANGER,
                    borderRadius: 8,
                    paddingHorizontal: 4,
                    minWidth: 16,
                    height: 16,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 10 }}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ),
        tabBarStyle: {
          height: 80,
          paddingTop: 6,
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="HomeScreen"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={22}
              color={color}
            />
          ),
          tabBarLabel: "Trang chủ",
          title: "SMART PARKING",
        }}
      />

      <Tabs.Screen
        name="HistoryBooking"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <MaterialIcons
              name={focused ? "access-time-filled" : "access-time"}
              size={22}
              color={color}
            />
          ),
          title: "HOẠT ĐỘNG",
          tabBarLabel: "Hoạt động",
        }}
      />

      <Tabs.Screen
        name="MapParking"
        options={{
          title: "BẢN ĐỒ BÃI",
          tabBarButton: (props) => {
            const segments = useSegments();
            const focused = segments[segments.length - 1] === "MapParking";
            const { delayLongPress, style, onPress, ...rest } = props as any;
            return (
              <TouchableOpacity
                {...rest}
                onPress={onPress}
                delayLongPress={undefined}
                style={[
                  style,
                  {
                    top: -25,
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]}
                activeOpacity={0.9}
              >
                <View
                  style={{
                    width: 65,
                    height: 65,
                    borderRadius: 32,
                    borderWidth: 2,
                    borderStyle: focused ? "solid" : "dotted",
                    borderColor: ACTIVE,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: focused ? ACTIVE : "#bde5ff",
                  }}
                >
                  <MaterialCommunityIcons
                    name="google-maps"
                    size={32}
                    color={focused ? "#fff" : ACTIVE}
                  />
                </View>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 9,
                    color: "#fff",
                    fontWeight: "400",
                    paddingVertical: 2,
                    paddingHorizontal: 8,
                    borderRadius: 10,
                    backgroundColor: ACTIVE,
                  }}
                >
                  Bản đồ
                </Text>
              </TouchableOpacity>
            );
          },
        }}
      />

      <Tabs.Screen
        name="QRScreen"
        options={{
          title: "Mã QR",
          tabBarLabel: "QR",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "qr-code" : "qr-code-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="SettingScreen"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={22} color={color} />
          ),
          title: "TÀI KHOẢN",
          tabBarLabel: "Tài khoản",
        }}
      />
    </Tabs>
  );
}
