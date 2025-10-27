import React, { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import Field from "@/app/components/ui/Field";
import Select, { Option } from "@/app/components/ui/Select";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getProfile } from "@/lib/api/auth";
import {
  getVehicle,
  createVehicle,
  updateVehicle,
  type VehicleType,
} from "@/lib/api/vehicles";
import { Vehicle } from "@/lib/api/vehicles";

// Các loại xe theo backend
const VEHICLE_TYPES: Option[] = [
  { label: "Xe máy", value: "motorbike" },
  { label: "Xe ô tô 4 chỗ", value: "car_4_seat" },
  { label: "Xe ô tô 7 chỗ", value: "car_7_seat" },
  { label: "Xe tải nhẹ", value: "light_truck" },
];

export default function AddVehicleScreen() {
  const params = useLocalSearchParams();
  const isEdit = !!params.id;
  const vehicleId = params.id ? parseInt(params.id as string) : null;

  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState<number>(0);
  const [loadingUser, setLoadingUser] = useState(true);
  const [vehicleType, setVehicleType] = useState<Option | null>(null);
  const [licensePlate, setLicensePlate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(false);

  // Load user
  useEffect(() => {
    (async () => {
      try {
        const user = await getProfile();
        setUserName(user?.name ?? "");
        setUserId(user?.id ?? 0);
      } catch (e: any) {
        console.log("Lỗi getProfile:", e?.response?.data || e?.message);
      } finally {
        setLoadingUser(false);
      }
    })();
  }, []);

  // Load vehicle nếu đang sửa
  useEffect(() => {
    if (isEdit && vehicleId) {
      loadVehicle();
    }
  }, [isEdit, vehicleId]);

  const loadVehicle = async () => {
    if (!vehicleId) return;
    try {
      setLoadingVehicle(true);
      const vehicle = await getVehicle(vehicleId);
      setLicensePlate(vehicle.license_plate);

      const typeOption = VEHICLE_TYPES.find(
        (t) => t.value === vehicle.vehicle_type
      );
      if (typeOption) {
        setVehicleType(typeOption);
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.message || "Không thể tải thông tin phương tiện"
      );
    } finally {
      setLoadingVehicle(false);
    }
  };

  const errors = {
    licensePlate: !licensePlate.trim() ? "Biển số không được để trống" : null,
    vehicleType: !vehicleType ? "Vui lòng chọn loại xe" : null,
  };

  const hasErrors = Object.values(errors).some(Boolean);

  const onSubmit = async () => {
    if (hasErrors || loadingUser || submitting) return;

    try {
      setSubmitting(true);

      if (isEdit && vehicleId) {
        await updateVehicle(vehicleId, {
          vehicle_type: vehicleType!.value as VehicleType,
          license_plate: licensePlate,
        });
        Alert.alert("Thành công", "Cập nhật phương tiện thành công", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        await createVehicle({
          user_id: userId,
          vehicle_type: vehicleType!.value as VehicleType,
          license_plate: licensePlate,
        });
        Alert.alert("Thành công", "Thêm phương tiện thành công", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể lưu phương tiện");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingVehicle) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding" })}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerClassName="px-6 py-10">
        <View className="flex-row items-center justify-between mt-5">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 rounded-full items-center justify-center"
          >
            <Ionicons name="chevron-back" size={25} color="#000" />
          </TouchableOpacity>
          <Text className="text-black font-semibold text-xl">
            {isEdit ? "Sửa phương tiện" : "Thêm phương tiện"}
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

        <View className="mb-3">
          <View className="flex-row justify-between">
            <Text className="text-gray-600 mb-1">Họ tên</Text>
            {!loadingUser && (
              <Text className="text-xs text-emerald-600">
                Tự động từ tài khoản
              </Text>
            )}
          </View>

          {loadingUser ? (
            <View className="h-12 rounded-2xl border border-gray-300 bg-gray-100 items-center justify-center">
              <ActivityIndicator />
            </View>
          ) : (
            <Field
              label=""
              value={userName}
              editable={false}
              selectTextOnFocus={false}
              placeholder="Đang tải tên..."
              className="h-12 rounded-2xl px-4 border border-gray-300 bg-gray-100 text-gray-700"
            />
          )}
        </View>

        <Select
          label="Loại phương tiện"
          value={vehicleType}
          options={VEHICLE_TYPES}
          onSelect={setVehicleType}
          error={errors.vehicleType}
          disabled={isEdit}
        />

        <Field
          label="Biển số"
          value={licensePlate}
          onChangeText={setLicensePlate}
          placeholder="51A-12345"
          autoCapitalize="characters"
          error={errors.licensePlate}
        />

        <TouchableOpacity
          onPress={onSubmit}
          disabled={hasErrors || submitting || loadingUser}
          className={`h-12 rounded-2xl items-center justify-center mt-2 ${
            hasErrors || submitting || loadingUser
              ? "bg-blue-300"
              : "bg-blue-600"
          }`}
        >
          <Text className="text-white font-semibold">
            {submitting ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Thêm mới"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
