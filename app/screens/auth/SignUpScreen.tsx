import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { register } from "@/lib/api/auth";

export default function RegisterScreen() {
  const [name, setName] = useState("Nguyễn Phú Tài");
  const [email, setEmail] = useState("nphutai@gmail.com");
  const [phone, setPhone] = useState("0788655673");
  const [password, setPassword] = useState("12345678");
  const [cccd, setCccd] = useState("077204002838");
  const [apartmentcode, setApartmentCode] = useState("A1");

  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [phoneErr, setPhoneErr] = useState<string | null>(null);
  const [cccdErr, setCCCDErr] = useState<string | null>(null);
  const [nameErr, serNameErr] = useState<string | null>(null);
  const [apartmentcodeErr, setApartmentCodeErr] = useState<string | null>(null);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePhone = (v: string) => /^[0-9]{10}$/.test(v.replace(/\D/g, ""));
  const validateCCCD = (v: string) => /^[0-9]{12}$/.test(v.replace(/\D/g, ""));

  const onBlurEmail = () =>
    setEmailErr(validateEmail(email) ? null : "Email không hợp lệ");

  const onBlurPhone = () =>
    setPhoneErr(validatePhone(phone) ? null : "Số điện thoại không hợp lệ");
  const onBlurCCCD = () =>
    setCCCDErr(validateCCCD(cccd) ? null : "Căn cước công dân không hợp lệ");

  const onSubmit = async () => {
    onBlurEmail();
    onBlurPhone();

    if (!name || !email || !phone || !password || !cccd) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (emailErr || phoneErr) return;

    try {
      await register(name, email, password, phone, cccd, apartmentcode);

      Alert.alert("Thành công", "Đăng ký thành công!");
      router.replace("/screens/auth/LoginScreen");
    } catch (err: any) {
      const errors = err?.errors || {};
      if (errors.email) setEmailErr(errors.email[0]);
      if (errors.phone) setPhoneErr(errors.phone[0]);

      Alert.alert("Đăng ký thất bại", err?.message || "Có lỗi xảy ra");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding" })}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerClassName="px-5 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center justify-between mt-10">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} />
          </Pressable>
          <Text className="flex-1 text-center text-xl font-semibold">
            Đăng ký
          </Text>
          <View className="h-10 w-10" />
        </View>

        <View className="items-center mt-20 mb-6">
          <Image
            source={require("../../../assets/logo.png")}
            className="w-28 h-36"
            resizeMode="contain"
          />
        </View>

        <View className="gap-3 mt-2">
          <Field
            label="Họ tên"
            value={name}
            onChangeText={setName}
            placeholder="Nguyễn Phú Tài"
            icon="user-circle"
          />

          <View>
            <Field
              label="E-Mail"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (emailErr) setEmailErr(null);
              }}
              onBlur={onBlurEmail}
              placeholder="abc@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              icon="voicemail"
            />
            {emailErr ? (
              <Text className="text-red-500 text-xs mt-1">{emailErr}</Text>
            ) : null}
          </View>

          <View>
            <Field
              label="Số điện thoại"
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                if (phoneErr) setPhoneErr(null);
              }}
              onBlur={onBlurPhone}
              placeholder="0123456789"
              keyboardType="phone-pad"
              icon="phone"
            />
            {phoneErr ? (
              <Text className="text-red-500 text-xs mt-1">{phoneErr}</Text>
            ) : null}
          </View>

          <Field
            label="Mã căn hộ"
            value={apartmentcode}
            onChangeText={setApartmentCode}
            placeholder="A1"
            autoCapitalize="none"
            icon="address-card"
          />
          <Field
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            placeholder="*******"
            secureTextEntry
            icon="lock"
          />
        </View>

        <Pressable
          onPress={onSubmit}
          className="mt-5 bg-blue-600 rounded-2xl py-4 items-center shadow-sm"
        >
          <Text className="text-white font-semibold">Đăng ký</Text>
        </Pressable>

        <View className="items-center mt-4">
          <Text className="text-gray-600">
            Đã có tài khoản?{" "}
            <Link
              href="/screens/auth/LoginScreen"
              className="text-blue-600 font-semibold"
            >
              Đăng nhập
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  onBlur?: () => void;
  icon?: keyof typeof FontAwesome5.glyphMap;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  onBlur,
  icon = "information-circle",
}: FieldProps) {
  return (
    <View>
      <Text className="mb-1 text-gray-600">{label}</Text>
      <View className="relative">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor="#d9d7d7"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          className="border border-gray-300 rounded-2xl px-4 py-3 pr-12 bg-white"
        />
        <View className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50">
          <FontAwesome5 name={icon} size={20} />
        </View>
      </View>
    </View>
  );
}
