import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, Entypo } from "@expo/vector-icons";
import { sendPasswordResetOtp } from "../../../lib/api/auth";

export default function ForgotPasswordScreen() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("nphutai49@gmail.com");
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const onSend = async () => {
    if (!validateEmail(email)) {
      setEmailErr("Email không hợp lệ");
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetOtp(email.trim());
      router.push({
        pathname: "/screens/auth/ReceiveOTPScreen",
        params: { email },
      });
    } catch (e: any) {
      Alert.alert("Không thể gửi OTP", e?.message || "Vui lòng thử lại.");
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
        contentContainerClassName="px-2"
      >
        <View className="flex-row items-center justify-between mt-10 px-4">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} />
          </Pressable>
          <Text className="flex-1 text-center text-xl font-semibold">
            Quên mật khẩu
          </Text>
          <View className="h-10 w-10" />
        </View>

        <View className="items-center mt-20 mb-6">
          <Image
            source={require("../../../assets/images/forgot.png")}
            className="w-40 h-40"
            resizeMode="contain"
            style={{ width: 260, height: 180 }}
          />
        </View>

        <View className="px-6 mt-6">
          <Text className="text-2xl font-semibold text-center">
            Bạn quên mật khẩu ?
          </Text>
          <Text className="text-center text-gray-600 mt-2">
            Đừng lo lắng! Bạn hãy nhập email đã đăng ký tài khoản để nhận mã xác
            thực
          </Text>
        </View>

        <Text className="px-6 mt-8 mb-2 text-gray-600">Email của bạn</Text>

        <View className="flex-row items-center mx-6 bg-white border border-gray-300 rounded-2xl">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="abc@gmail.com"
            keyboardType="email-address"
            placeholderTextColor="#9ca3af"
            className="flex-1 px-3 py-3 mb-1 text-xl"
          />

          <View className="px-3">
            <Ionicons
              name={
                validateEmail(email) ? "checkmark-circle" : "information-circle"
              }
              size={20}
              color={validateEmail(email) ? "#22c55e" : "#9ca3af"}
            />
          </View>
        </View>

        <View className="px-6 mt-6">
          <Pressable
            onPress={onSend}
            disabled={!validateEmail(email) || loading}
            className={`h-12 rounded-2xl items-center justify-center ${
              validateEmail(email) && !loading ? "bg-blue-600" : "bg-blue-400"
            }`}
          >
            <Text className="text-white font-semibold">
              {loading ? "Đang gửi..." : "Gửi"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
