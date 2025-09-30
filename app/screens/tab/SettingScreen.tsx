import { useEffect } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { logout } from "@/lib/api/auth";

export default function LogoutScreen() {
  useEffect(() => {
    const doLogout = async () => {
      try {
        await logout(); // gọi API và clear token
        router.replace("/screens/auth/LoginScreen");
      } catch (err: any) {
        console.log("LOGOUT ERROR:", err);
        Alert.alert("Có lỗi khi đăng xuất");
      }
    };
    doLogout();
  }, []);

  return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color="blue" />
      <Text className="mt-3 text-gray-600">Đang đăng xuất...</Text>
    </View>
  );
}
