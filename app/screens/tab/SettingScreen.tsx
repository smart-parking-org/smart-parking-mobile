import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getProfile, logout } from "@/lib/api/auth";
// (tuỳ chọn) nếu có guard
// import { useAuthGuard } from "@/lib/hooks/useAuthGuard";

type User = { id: number; name: string; email: string; phone?: string };

const Row = ({
  icon,
  label,
  value,
  onPress,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    className="flex-row items-center justify-between px-4 py-4 bg-white"
  >
    <View className="flex-row items-center">
      <Ionicons name={icon} size={20} color="#64748b" />
      <Text className="ml-3 text-[16px] text-gray-800">{label}</Text>
    </View>

    {right ? (
      right
    ) : (
      <View className="flex-row items-center">
        {value ? <Text className="mr-2 text-gray-500">{value}</Text> : null}
        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
      </View>
    )}
  </TouchableOpacity>
);

export default function SettingScreen() {
  // useAuthGuard();

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProfile();
        // backend của bạn có thể trả {data:{...}} hoặc {...}
        const u = (res?.data ?? res) as User;
        setUser(u);
      } catch (e: any) {
        console.log("ME ERROR:", e?.response?.data || e?.message);
      } finally {
        setLoadingUser(false);
      }
    })();
  }, []);
  const handleLogout = () => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await logout(); // gọi API /auth/logout và clear token
            router.replace("/screens/auth/LoginScreen"); // quay về login
          } catch (err) {
            console.log("Logout error:", err);
          }
        },
      },
    ]);
  };
  const onLogout = async () => {
    try {
      await logout();
      router.replace("/screens/auth/LoginScreen");
    } catch (e: any) {
      console.log("LOGOUT ERROR:", e?.response?.data || e?.message);
      Alert.alert("Có lỗi khi đăng xuất");
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100">
      {/* Header + Profile */}
      <View className="bg-white px-5 pt-12 pb-5">
        <Text className="text-2xl font-semibold mb-6 text-center">
          Settings
        </Text>

        <View className="flex-row items-center">
          <Image
            source={{
              uri: "https://i.pravatar.cc/150?img=12" /* thay bằng avatar user nếu có */,
            }}
            className="w-14 h-14 rounded-full"
          />
          <View className="ml-4">
            {loadingUser ? (
              <ActivityIndicator />
            ) : (
              <>
                <Text className="text-lg font-medium">
                  {user?.name ?? "Người dùng"}
                </Text>
                <Text className="text-gray-500">{user?.email ?? "-"}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Account */}
      <View className="mt-3">
        <Text className="px-4 py-2 text-xs uppercase text-gray-500">
          Tài khoản
        </Text>

        <View className="bg-white">
          <Row
            icon="person-circle-outline"
            label="Hồ sơ"
            onPress={() => router.push("/screens/tab/ProfileScreen")}
          />
          <View className="h-[1px] bg-gray-100" />
          <Row
            icon="key-outline"
            label="Đổi mật khẩu"
            onPress={() => router.push("/screens/auth/ResetPasswordScreen")}
          />
        </View>
      </View>

      {/* Preferences */}
      <View className="mt-6">
        <Text className="px-4 py-2 text-xs uppercase text-gray-500">
          Tuỳ chọn
        </Text>

        <View className="bg-white">
          <Row
            icon="moon-outline"
            label="Dark mode"
            right={<Switch value={darkMode} onValueChange={setDarkMode} />}
          />
          <View className="h-[1px] bg-gray-100" />
          <Row
            icon="notifications-outline"
            label="Thông báo"
            right={
              <Switch value={notifications} onValueChange={setNotifications} />
            }
          />
        </View>
      </View>

      {/* About */}
      <View className="mt-6">
        <Text className="px-4 py-2 text-xs uppercase text-gray-500">Khác</Text>
        <View className="bg-white">
          <Row
            icon="information-circle-outline"
            label="Giới thiệu"
            onPress={() => {}}
          />
          <View className="h-[1px] bg-gray-100" />
          <Row
            icon="document-text-outline"
            label="Điều khoản & Quyền riêng tư"
            onPress={() => {}}
          />
        </View>
      </View>

      {/* Logout */}
      <View className="px-4 my-10">
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-500 rounded-2xl py-4 items-center"
        >
          <Text className="text-white font-semibold">Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
