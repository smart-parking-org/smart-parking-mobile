import { useEffect, useRef } from "react";
import { View, Image, Animated, Easing } from "react-native";
import { router } from "expo-router";
// (tuỳ chọn) nếu bạn dùng SecureStore để lưu token, bỏ comment 2 dòng dưới:
// import * as SecureStore from "expo-secure-store";

export default function SplashScreenInApp() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // hiệu ứng fade + nhẹ scale-in
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Giả lập kiểm tra đăng nhập (1.2s)
    const t = setTimeout(async () => {
      // Nếu có token thì vào tabs, không thì về login
      // const token = await SecureStore.getItemAsync("access_token");
      const token = null; // demo: chưa dùng API
      if (token) router.replace("/screens/tab/HomeScreen");
      else router.replace("/screens/auth/LoginScreen");
    }, 1200);

    return () => clearTimeout(t);
  }, []);

  return (
    <View className="flex-1 bg-white items-center justify-center">
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Image
          source={require("../assets/logo.png")} // đổi path nếu logo bạn ở chỗ khác
          style={{ width: 140, height: 140 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}
