import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
  Alert,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function OtpScreen() {
  const LENGTH = 4;

  const inputs = useRef<Array<TextInput | null>>([]);
  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: LENGTH }, () => "")
  );
  const [seconds, setSeconds] = useState(30);

  // focus ô đầu khi mở
  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const onChange = (value: string, index: number) => {
    const v = value.replace(/\D/g, "").slice(-1); // chỉ 1 số
    const next = [...digits];
    next[index] = v;
    setDigits(next);

    if (v && index < LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const onKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      inputs.current[index - 1]?.focus();
    }
  };

  const code = digits.join("");

  const onVerify = () => {
    if (code.length !== LENGTH) {
      Alert.alert("Thiếu OTP", `Vui lòng nhập đủ ${LENGTH} số.`);
      return;
    }
    // demo: chưa gọi API
    //Alert.alert("OTP", `Mã: ${code}`);
    router.replace("/screens/auth/ResetPasswordScreen");
  };

  const onResend = () => {
    if (seconds > 0) return;
    // TODO: gọi API resend
    setDigits(Array.from({ length: LENGTH }, () => ""));
    inputs.current[0]?.focus();
    setSeconds(30);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding" })}
      className="flex-1 bg-white"
    >
      
      <View className="flex-row items-center justify-between mt-10 px-4">
        <Pressable onPress={() => router.back()}className="h-10 w-10 items-center justify-center">
          <Ionicons name="chevron-back" size={24} />
        </Pressable>
        <Text className="flex-1 text-center text-xl font-semibold">Xác thực OTP</Text>
        <View className="h-10 w-10" />
      </View>

      <View className="items-center mt-20 mb-6">
          <Image
            source={require("../../../assets/images/otp.png")}
            className="w-40 h-40"
            resizeMode="contain"
            style={{ width: 260, height: 180 }}
          />
        </View>

      <View className="px-6 mt-4">
        <Text className="text-2xl font-semibold text-center">Nhập mã OTP</Text>
        <Text className="text-center text-gray-600 mt-2">
          Mã gồm 4 chữ số đã được gửi đến{" "}
          <Text className="font-semibold">+84 788655673</Text>
        </Text>
      </View>

      <View className="flex-row items-center justify-center gap-3 mt-8 px-6">
        {Array.from({ length: LENGTH }).map((_, i) => (
          <TextInput
            key={i}
            // ref callback đúng kiểu
            ref={(el: TextInput | null) => {
              inputs.current[i] = el;
            }}
            value={digits[i]}
            onChangeText={(t) => onChange(t, i)}
            onKeyPress={(e) => onKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={1}
            className="w-14 h-14 rounded-2xl border border-gray-300 text-center text-xl pb-2"
            placeholderTextColor="#9ca3af"
            returnKeyType={i === LENGTH - 1 ? "done" : "next"}
          />
        ))}
      </View>

      <View className="px-6 mt-8">
        <Pressable
          onPress={onVerify}
          className="bg-blue-600 rounded-2xl h-12 items-center justify-center"
        >
          <Text className="text-white font-semibold">Xác thực</Text>
        </Pressable>
      </View>

      <View className="items-center mt-3">
        <Pressable onPress={onResend} disabled={seconds > 0}>
          <Text className={`font-medium ${seconds > 0 ? "text-gray-400" : "text-blue-600"}`}>
            Gửi lại OTP {seconds > 0 ? `(00:${String(seconds).padStart(2, "0")})` : ""}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
