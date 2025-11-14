import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { getVehicles, Vehicle } from "@/lib/api/vehicles";
import { getProfile } from "@/lib/api/auth";
import { AppColor } from "@/lib/utils/color";

export default function BookingFormScreen() {
  const { lotId, lotName } = useLocalSearchParams<{
    lotId: string;
    lotName?: string;
  }>();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [startDateTime] = useState(new Date());
  const [duration, setDuration] = useState(120);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // combobox state
  const [vehicleModal, setVehicleModal] = useState(false);

  useEffect(() => {
    loadUserAndVehicles();
  }, []);

  const loadUserAndVehicles = async () => {
    try {
      const user = await getProfile();
      setUserId(user.id);

      const response = await getVehicles(user.id);
      setVehicles(response.data);

      const primary = response.data.find((v) => v.is_primary);
      if (primary) setSelectedVehicle(primary);
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
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

    // check limit
    try {
      const { getMyActiveReservations } = await import("@/lib/api/booking");
      const user = await getProfile();
      const activeReservations = await getMyActiveReservations(user.id);
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
    }

    try {
      setSubmitting(true);
      const { createReservation } = await import("@/lib/api/booking");
      const desiredStartTime = new Date(Date.now() + 5000).toISOString();

      const payload = {
        parking_lot_id: parseInt(lotId),
        user_id: userId,
        vehicle_id: selectedVehicle.id,
        vehicle_type: selectedVehicle.vehicle_type,
        desired_start_time: desiredStartTime,
        duration_minutes: duration,
      };

      const response = await createReservation(payload);

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

  const incrementDuration = () =>
    duration + 30 <= 1440 && setDuration(duration + 30);
  const decrementDuration = () =>
    duration - 30 >= 30 && setDuration(duration - 30);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h} giờ ${m} phút`;
    if (h > 0) return `${h} giờ`;
    return `${m} phút`;
  };

  if (loading) {
    return (
      <>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: "#F9FAFB" }}
          edges={["top", "bottom"]}
        >
          <Stack.Screen
            options={{
              headerShown: true,
              title: "ĐẶT CHỖ",
              headerTitleAlign: "center",
              headerStyle: { backgroundColor: AppColor.PRIMARY },
              headerShadowVisible: false,
              headerTitleStyle: {
                fontWeight: "800",
                fontSize: 16,
                color: "#fff",
              },
              headerTintColor: "#fff",
              statusBarStyle: "light",
            }}
          />
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text>Đang tải...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "ĐẶT CHỖ",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: AppColor.PRIMARY },
          headerTitleStyle: { fontWeight: "800", fontSize: 16, color: "#fff" },
        }}
      />

      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#F3F4F6" }}
        edges={["bottom"]}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* BÃI ĐỖ */}
          <View
            className="bg-white rounded-2xl p-4 mb-4"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text className="text-gray-500 text-xs font-medium mb-1 tracking-wider">
              BÃI ĐỖ
            </Text>
            <Text className="font-semibold text-lg text-gray-900">
              {lotName || lotId}
            </Text>
          </View>

          {/* PHƯƠNG TIỆN – Combobox gọn */}
          <View
            className="bg-white rounded-2xl p-4 mb-4"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text className="text-gray-500 text-xs font-medium mb-3 tracking-wider">
              PHƯƠNG TIỆN
            </Text>

            {/* Nút mở combobox */}
            <TouchableOpacity
              onPress={() => setVehicleModal(true)}
              activeOpacity={0.85}
              className="border border-gray-200 bg-white rounded-2xl px-4 py-3 flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <View className="h-9 w-9 rounded-lg bg-gray-100 items-center justify-center mr-3">
                  <Ionicons
                    name={
                      selectedVehicle?.vehicle_type === "motorbike"
                        ? "bicycle"
                        : "car"
                    }
                    size={18}
                    color="#6b7280"
                  />
                </View>
                <View>
                  <Text className="font-semibold text-base text-gray-900">
                    {selectedVehicle?.license_plate ?? "Chọn phương tiện"}
                  </Text>
                  {!!selectedVehicle && (
                    <Text className="text-gray-500 text-xs">
                      {selectedVehicle.vehicle_type}
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-down" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* BẮT ĐẦU */}
          <View
            className="bg-white rounded-2xl p-4 mb-4"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text className="text-gray-500 text-xs font-medium mb-2 tracking-wider">
              BẮT ĐẦU
            </Text>

            <View className="border border-gray-200 rounded-xl px-3 py-3 flex-row items-center justify-between bg-gray-50">
              <View className="flex-1 pr-2">
                <Text className="font-semibold text-gray-900">
                  {startDateTime.toLocaleString("vi-VN")}
                </Text>
                <Text className="text-gray-500 text-[11px] mt-0.5">
                  Thời gian hiện tại (tự động)
                </Text>
              </View>
              <View className="h-9 w-9 bg-white rounded-lg items-center justify-center border border-gray-200">
                <Ionicons name="time" size={18} color="#6b7280" />
              </View>
            </View>
          </View>

          {/* THỜI LƯỢNG */}
          <View
            className="bg-white rounded-2xl p-4 mb-4"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text className="text-gray-500 text-xs font-medium mb-3 tracking-wider">
              THỜI LƯỢNG
            </Text>

            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={decrementDuration}
                disabled={duration <= 30}
                className={`h-12 w-12 rounded-2xl items-center justify-center ${
                  duration <= 30 ? "bg-gray-200" : "bg-blue-100"
                }`}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="remove"
                  size={22}
                  color={duration <= 30 ? "#9ca3af" : "#2563eb"}
                />
              </TouchableOpacity>

              <View className="flex-1 items-center mx-4">
                <Text className="text-3xl font-extrabold text-gray-900">
                  {formatDuration(duration)}
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  ({duration} phút)
                </Text>
              </View>

              <TouchableOpacity
                onPress={incrementDuration}
                disabled={duration >= 1440}
                className={`h-12 w-12 rounded-2xl items-center justify-center ${
                  duration >= 1440 ? "bg-gray-200" : "bg-blue-100"
                }`}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="add"
                  size={22}
                  color={duration >= 1440 ? "#9ca3af" : "#2563eb"}
                />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-center mt-3">
              <View className="flex-row gap-2">
                {[30, 60, 120, 180].map((m) => {
                  const picked = duration === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setDuration(m)}
                      className={`px-3 py-1.5 rounded-lg border ${
                        picked
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-300 bg-white"
                      }`}
                      activeOpacity={0.9}
                    >
                      <Text
                        className={`text-xs ${
                          picked
                            ? "text-blue-600 font-semibold"
                            : "text-gray-700"
                        }`}
                      >
                        {formatDuration(m)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text className="text-gray-500 text-[11px] mt-3 text-center">
              Tối thiểu 30 phút, tối đa 24 giờ
            </Text>
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || !selectedVehicle}
            className={`h-14 rounded-2xl items-center justify-center ${
              submitting || !selectedVehicle ? "bg-gray-300" : "bg-blue-600"
            }`}
            activeOpacity={0.85}
            style={{
              shadowColor:
                submitting || !selectedVehicle
                  ? "transparent"
                  : AppColor.PRIMARY,
              shadowOpacity: submitting || !selectedVehicle ? 0 : 0.18,
              shadowRadius: submitting || !selectedVehicle ? 0 : 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: submitting || !selectedVehicle ? 0 : 3,
            }}
          >
            <Text className="text-white font-bold tracking-wide">
              {submitting ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẶT CHỖ"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* ===== Combobox Modal cho PHƯƠNG TIỆN ===== */}
      <Modal
        visible={vehicleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setVehicleModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }}
          onPress={() => setVehicleModal(false)}
        />
        <View
          style={{
            backgroundColor: "#fff",
            padding: 16,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "65%",
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <View
              style={{
                width: 38,
                height: 4,
                borderRadius: 2,
                backgroundColor: "#E5E7EB",
              }}
            />
          </View>
          <Text
            style={{
              fontWeight: "800",
              fontSize: 16,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Chọn phương tiện
          </Text>

          <FlatList
            data={vehicles}
            keyExtractor={(i) => String(i.id)}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const active = selectedVehicle?.id === item.id;
              return (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedVehicle(item);
                    setVehicleModal(false);
                  }}
                  activeOpacity={0.9}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: active ? "#2563EB" : "#E5E7EB",
                    backgroundColor: active ? "#EFF6FF" : "#FFF",
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        height: 44,
                        width: 44,
                        borderRadius: 12,
                        backgroundColor: active ? "#fff" : "#F3F4F6",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons
                        name={
                          item.vehicle_type === "motorbike" ? "bicycle" : "car"
                        }
                        size={20}
                        color={active ? "#2563EB" : "#6B7280"}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text
                          style={{
                            fontWeight: "700",
                            fontSize: 16,
                            marginRight: 8,
                          }}
                        >
                          {item.license_plate}
                        </Text>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: active ? "#3B82F6" : "#D1D5DB",
                            backgroundColor: active ? "#fff" : "#F3F4F6",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              color: active ? "#2563EB" : "#6B7280",
                            }}
                          >
                            {item.vehicle_type}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}
                      >
                        Phương tiện đã lưu
                      </Text>
                    </View>

                    <Ionicons
                      name={active ? "checkmark-circle" : "ellipse-outline"}
                      size={22}
                      color={active ? "#2563EB" : "#D1D5DB"}
                    />
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text
                style={{
                  textAlign: "center",
                  color: "#6B7280",
                  paddingVertical: 20,
                }}
              >
                Chưa có phương tiện nào
              </Text>
            }
          />
        </View>
      </Modal>
    </>
  );
}
