import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
  Alert,
  ScrollView
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  const minLen = 8;
  const passOk = password.length >= minLen;
  const match = password === confirm && confirm.length > 0;
  const canSubmit = passOk && match;

  const onSubmit = () => {
    if (!canSubmit) return;
    Alert.alert("Hoàn thành", "Mật khẩu của bạn đã được thay đổi.");
    router.replace("/screens/auth/LoginScreen");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding" })}
      className="flex-1 bg-white"
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-2">
        <View className="flex-row items-center justify-between mt-10 px-4">
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center">
              <Ionicons name="chevron-back" size={24}/></Pressable>
            <Text className="flex-1 text-center text-xl font-semibold">Đặt lại mật khẩu</Text>
            <View className="h-10 w-10" />
          </View>

        <View className="items-center mt-4" style={{ width: 260, height: 160 }}>
          {/* <Image
            source={require("../../../assets/images/reset.png")} 
            resizeMode="contain"
            style={{ width: 260, height: 160 }}
          /> */}
        </View>

        <View className="px-6 mt-6">
          <Text className="text-2xl font-semibold text-center">Đặt lại mật khẩu của bạn</Text>

        </View>

        <View className="px-6 mt-6 gap-2">
          <Text className="text-gray-600 mb-1">Mật khẩu</Text>
          <View className="relative">
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!show1}
              placeholder="************"
              placeholderTextColor="#9ca3af"
              className="border border-gray-300 rounded-2xl px-4 py-3 pr-12"
            />
            <Pressable
              onPress={() => setShow1((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <Ionicons name={show1 ? "eye-off" : "eye"} size={20} color="#9ca3af" />
            </Pressable>
          </View>
          {!passOk ? (
            <Text className="text-xs text-gray-500">Đảm bảo có ít nhất {minLen} kí tự.</Text>
          ) : null}

          <Text className="text-gray-600 mt-2 mb-1">Xác nhận mật khẩu</Text>
          <View className="relative">
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!show2}
              placeholder="************"
              placeholderTextColor="#9ca3af"
              className="border border-gray-300 rounded-2xl px-4 py-3 pr-12"
            />
            <Pressable
              onPress={() => setShow2((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <Ionicons name={show2 ? "eye-off" : "eye"} size={20} color="#9ca3af" />
            </Pressable>
          </View>

          {!match && confirm.length > 0 ? (
            <Text className="text-red-500 text-xs mt-1">
              password do not match. Try again.
            </Text>
          ) : null}
        </View>

        <View className="px-6 mt-8">
          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit}
            className={`h-12 rounded-2xl items-center justify-center ${
              canSubmit ? "bg-blue-600" : "bg-blue-400"
            }`}
          >
            <Text className="text-white font-semibold">Submit</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
