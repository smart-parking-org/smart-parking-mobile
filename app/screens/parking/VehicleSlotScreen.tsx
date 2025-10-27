import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { getVehicles, Vehicle } from "@/lib/api/vehicles";
import { getProfile } from "@/lib/api/auth";

export default function BookingFormScreen() {
  const { lotId, lotName } = useLocalSearchParams<{
    lotId: string;
    lotName?: string;
  }>();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [startDateTime] = useState(new Date()); // Tự động = thời gian hiện tại
  const [duration, setDuration] = useState(120); // Default 2 hours

  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUserAndVehicles();
  }, []);

  const loadUserAndVehicles = async () => {
    try {
      const user = await getProfile();
      setUserId(user.id);

      const response = await getVehicles(user.id);
      setVehicles(response.data);

      // Auto-select primary vehicle
      const primary = response.data.find((v) => v.is_primary);
      if (primary) setSelectedVehicle(primary);
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const mapVehicleType = (
    type: string
  ): "motorbike" | "car_4_seat" | "car_7_seat" | "light_truck" => {
    switch (type) {
      case "bike":
        return "motorbike";
      case "car":
        return "car_4_seat";
      default:
        return "motorbike";
    }
  };

  const handleSubmit = async () => {
    if (!selectedVehicle || !userId) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn phương tiện");
      return;
    }

    if (duration < 30 || duration > 1440) {
      Alert.alert("Lỗi", "Thời lượng phải từ 30 đến 1440 phút");
      return;
    }

    // Kiểm tra giới hạn từ DATABASE (không phải local storage)
    try {
      const { getMyActiveReservations } = await import("@/lib/api/booking");

      // Get user_id
      const user = await getProfile();
      const activeReservations = await getMyActiveReservations(user.id);

      // Count confirmed reservations
      const confirmedCount = activeReservations.filter(
        (r) => r.status === "confirmed"
      ).length;

      if (confirmedCount >= 3) {
        Alert.alert(
          "Đạt giới hạn",
          "Bạn đã có 3 đặt chỗ đang xác nhận. Vui lòng thanh toán một số đặt chỗ trước khi đặt chỗ mới."
        );
        return;
      }
    } catch (e) {
      console.error("Error checking reservations:", e);
      // Vẫn cho phép tiếp tục nếu check fail
    }

    try {
      setSubmitting(true);

      const { createReservation } = await import("@/lib/api/booking");

      const desiredStartTime = new Date(Date.now() + 60 * 1000).toISOString();

      const payload = {
        parking_lot_id: parseInt(lotId),
        user_id: userId,
        vehicle_id: selectedVehicle.id,
        vehicle_type: selectedVehicle.vehicle_type,
        desired_start_time: desiredStartTime,
        duration_minutes: duration,
      };

      console.log(
        "🚀 Submitting reservation:",
        JSON.stringify(payload, null, 2)
      );

      const response = await createReservation(payload);
      console.log("✅ Reservation response:", response);

      // Navigate to confirmation
      router.push({
        pathname: "/screens/reservations/ConfirmBookingScreen",
        params: {
          reservationId: String(response.data.reservation.id),
          reservationCode: response.data.reservation.reservation_code,
        },
      });
    } catch (error: any) {
      console.error("❌ Reservation error:", error);

      const errorDetails =
        error.response?.data?.errors || error.response?.data?.message;
      const errorMessage = Array.isArray(errorDetails)
        ? errorDetails.join(", ")
        : errorDetails ||
          error.message ||
          "Không thể đặt chỗ. Vui lòng thử lại";

      Alert.alert("Không thể đặt chỗ", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const incrementDuration = () => {
    if (duration + 30 <= 1440) {
      setDuration(duration + 30);
    }
  };

  const decrementDuration = () => {
    if (duration - 30 >= 30) {
      setDuration(duration - 30);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours} giờ ${mins} phút`;
    } else if (hours > 0) {
      return `${hours} giờ`;
    } else {
      return `${mins} phút`;
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 pt-2 pb-3 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="font-bold text-xl">ĐẶT CHỖ</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {/* Bãi đỗ */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-gray-500 text-sm mb-2">BÃI ĐỖ</Text>
          <Text className="font-semibold text-lg">{lotName || lotId}</Text>
        </View>

        {/* Chọn phương tiện */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-gray-500 text-sm mb-3">PHƯƠNG TIỆN</Text>
          {vehicles.map((v) => (
            <TouchableOpacity
              key={v.id}
              onPress={() => setSelectedVehicle(v)}
              className={`p-3 rounded-xl mb-2 border-2 ${
                selectedVehicle?.id === v.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200"
              }`}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={v.vehicle_type === "motorbike" ? "bicycle" : "car"}
                  size={24}
                  color={selectedVehicle?.id === v.id ? "#3b82f6" : "#6b7280"}
                />
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-base">
                    {v.license_plate}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {v.vehicle_type}
                  </Text>
                </View>
                {selectedVehicle?.id === v.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Thời gian bắt đầu - chỉ hiển thị, không cho chọn */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-gray-500 text-sm mb-2">BẮT ĐẦU</Text>
          <View className="border border-gray-300 rounded-xl p-3 flex-row items-center justify-between bg-gray-50">
            <Text className="font-medium text-gray-700">
              {startDateTime.toLocaleString("vi-VN")}
            </Text>
            <Ionicons name="time" size={20} color="#6b7280" />
          </View>
          <Text className="text-gray-500 text-xs mt-2">
            Thời gian hiện tại (tự động)
          </Text>
        </View>

        {/* Thời lượng - với nút +/- */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-gray-500 text-sm mb-3">THỜI LƯỢNG</Text>

          {/* Duration Controller */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={decrementDuration}
              disabled={duration <= 30}
              className={`h-12 w-12 rounded-xl items-center justify-center ${
                duration <= 30 ? "bg-gray-200" : "bg-blue-100"
              }`}
            >
              <Ionicons
                name="remove"
                size={24}
                color={duration <= 30 ? "#9ca3af" : "#3b82f6"}
              />
            </TouchableOpacity>

            <View className="flex-1 items-center mx-4">
              <Text className="text-2xl font-bold text-gray-800">
                {formatDuration(duration)}
              </Text>
              <Text className="text-gray-500 text-xs mt-1">
                ({duration} phút)
              </Text>
            </View>

            <TouchableOpacity
              onPress={incrementDuration}
              disabled={duration >= 1440}
              className={`h-12 w-12 rounded-xl items-center justify-center ${
                duration >= 1440 ? "bg-gray-200" : "bg-blue-100"
              }`}
            >
              <Ionicons
                name="add"
                size={24}
                color={duration >= 1440 ? "#9ca3af" : "#3b82f6"}
              />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-center mt-3">
            <View className="flex-row gap-2">
              {[30, 60, 120, 180].map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  onPress={() => setDuration(minutes)}
                  className={`px-3 py-1 rounded-lg border ${
                    duration === minutes
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      duration === minutes
                        ? "text-blue-600 font-semibold"
                        : "text-gray-600"
                    }`}
                  >
                    {formatDuration(minutes)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text className="text-gray-500 text-xs mt-3 text-center">
            Tối thiểu 30 phút, tối đa 1440 phút (24 giờ)
          </Text>
        </View>

        {/* Nút xác nhận */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting || !selectedVehicle}
          className={`h-12 rounded-2xl items-center justify-center ${
            submitting || !selectedVehicle ? "bg-gray-400" : "bg-blue-600"
          }`}
        >
          <Text className="text-white font-semibold">XÁC NHẬN ĐẶT CHỖ</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
