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

export default function LoginScreen() {
  const [phone, setPhone] = useState("abc@gmail.com");
  const [password, setPassword] = useState("123");
  const [show, setShow] = useState(false);
  const onLogin = () => {
    if (!phone || !password) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập số điện thoại và mật khẩu");
      return;
    }
    router.replace("/screens/tab/HomeScreen");
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
          value={phone}
          onChangeText={setPhone}
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
          className="bg-blue-600 w-full h-14 justify-center rounded-2xl mb-4"
        >
          <Text className="text-white text-center font-semibold text-lg">
            Đăng nhập
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

        <View className="items-center mb-4">
          <Text className="text-gray-400">hoặc</Text>
        </View>

        <TouchableOpacity className="flex-row items-center border border-gray-300 rounded-2xl w-full py-3 mb-3">
          <Image
            source={{ uri: "https://img.icons8.com/color/48/google-logo.png" }}
            className="w-5 h-5 ml-4"
          />
          <Text className="text-center text-gray-700 flex-1 mr-4">
            Tiếp tục với Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center border border-gray-300 rounded-2xl w-full py-3">
          <Image
            source={{ uri: "https://img.icons8.com/color/48/facebook-new.png" }}
            className="w-5 h-5 ml-4"
          />
          <Text className="text-center text-gray-700 flex-1 mr-4">
            Tiếp tục với Facebook
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
