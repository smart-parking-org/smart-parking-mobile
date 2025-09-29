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
} from "react-native";
import { router } from "expo-router";
import { Ionicons, Entypo } from "@expo/vector-icons";

export default function ForgotPasswordScreen() {
  const [code, setCode] = useState("+84");
  const [phone, setPhone] = useState("");

  const isValidPhone = /^\d{9,10}$/.test(phone.replace(/\D/g, ""));

  const onSend = () => {
    if (!isValidPhone) {
      alert("Vui lòng nhập số điện thoại hợp lệ (9-10 số).");
      return;
    }
    router.push("/screens/auth/ReceiveOTPScreen");
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
            Đừng lo lắng! Bạn hãy nhập số điện thoại đã đăng ký tài khoản để
            nhận mã xác thực
          </Text>
        </View>

        <Text className="px-6 mt-8 mb-2 text-gray-600">Số điện thoại</Text>

        <View className="flex-row items-center mx-6 bg-white border border-gray-300 rounded-2xl">
          <Pressable
            className="flex-row items-center gap-2 px-3 py-3"
            onPress={() => {
              setCode(code === "+84" ? "+94" : "+84");
            }}
          >
            <Text className="font-semibold text-gray-700">{code}</Text>
            <Entypo name="chevron-small-down" size={18} color="#6b7280" />
          </Pressable>

          <View className="w-px h-6 bg-gray-300" />

          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="788655673"
            keyboardType="phone-pad"
            placeholderTextColor="#9ca3af"
            className="flex-1 px-3 py-3 mb-1 text-xl"
          />

          <View className="px-3">
            <Ionicons
              name={isValidPhone ? "checkmark-circle" : "information-circle"}
              size={20}
              color={isValidPhone ? "#22c55e" : "#9ca3af"}
            />
          </View>
        </View>

        <View className="px-6 mt-6">
          <Pressable
            onPress={onSend}
            className={`h-12 rounded-2xl items-center justify-center ${
              isValidPhone ? "bg-blue-600" : "bg-blue-400"
            }`}
          >
            <Text className="text-white font-semibold">Gửi mã OTP</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
