import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { login } from "@/lib/api/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("nphutai49@gmail.com");
  const [password, setPassword] = useState("12345678");
  const [show, setShow] = useState(true);
  const [loading, setLoading] = useState(false);
  const onLogin = async () => {
    const e = email.trim();
    const p = password;
    if (!e || !p) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập email và mật khẩu");
      return;
    }
    try {
      setLoading(true);
      await login(e, p); // hàm này đã lưu token
      router.replace("/screens/tab/HomeScreen"); // đổi route nếu khác
    } catch (err: any) {
      Alert.alert("Lỗi", err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding" })}
      className="flex-1 bg-white"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-6 py-10"
      >
        <View className="flex-row items-center justify-between mt-1 px-4">
          <Text className="flex-1 text-center text-xl font-semibold">
            Đăng nhập
          </Text>
        </View>
        <View className="items-center mt-20 mb-6">
          <Image
            source={require("../../../assets/logo.png")}
            className="w-28 h-36"
            resizeMode="contain"
          />
        </View>

        <Text className="text-gray-600 mb-1">Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="abc@gmail.com"
          keyboardType="email-address"
          placeholderTextColor="#858585"
          className="w-full h-14 border border-gray-300 rounded-2xl px-4 py-3 mb-3"
        />

        <Text className="text-gray-600 mb-1">Mật khẩu</Text>

        <View className="relative">
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={show}
            placeholder="************"
            placeholderTextColor="#9ca3af"
            className="w-full h-14 border border-gray-300 rounded-2xl px-4 py-3 mb-3"
          />
          <Pressable
            onPress={() => setShow((s) => !s)}
            className="absolute right-4 top-1/4 -translate-y-1/5"
          >
            <Ionicons
              name={show ? "eye-off" : "eye"}
              size={20}
              color="#9ca3af"
            />
          </Pressable>
        </View>

        <Link
          href="/screens/auth/SendOTPScreen"
          className="text-blue-600 font-semibold self-end mb-4"
        >
          <Text className="text-blue-500 text-sm">Quên mật khẩu?</Text>
        </Link>
        <TouchableOpacity
          onPress={onLogin}
          disabled={loading}
          className={`w-full h-14 justify-center rounded-2xl mb-4 ${
            loading ? "bg-blue-400" : "bg-blue-600"
          }`}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Text>
        </TouchableOpacity>

        <View className="items-center mt-1 mb-4">
          <Text className="text-gray-600">
            Chưa có tài khoản?{" "}
            <Link
              href="/screens/auth/SignUpScreen"
              className="text-blue-600 font-semibold"
            >
              Đăng ký
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
