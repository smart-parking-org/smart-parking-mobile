import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { apiPayment } from "../../../lib/api/client";

type ReservationData = {
  id: number;
  reservation_code: string;
  status: string;
  start_time: string;
  end_time: string;
  expires_at: string;
  slot?: {
    slot_code: string;
    vehicle_type: string;
  };
  user_snapshot?: {
    name: string;
    phone: string;
  };
  vehicle_snapshot?: {
    license_plate: string;
    vehicle_type: string;
  };
};

export default function QRCheckinScreen() {
  const { bookingId, reservationCode } = useLocalSearchParams<{
    bookingId: string;
    reservationCode?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [qr, setQr] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [ttl, setTtl] = useState(0);

  const formatSeconds = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  const load = useCallback(async () => {
    if (!bookingId) return;

    try {
      setLoading(true);

      // Load reservation details từ API - BỎ /api vì baseURL đã có
      const response = await apiPayment.get<{ data: ReservationData }>(
        `/reservations/${bookingId}`
      );
      const resData = response.data.data;
      setReservation(resData);

      // Tạo QR payload
      const qrPayload = JSON.stringify({
        type: "booking_checkin",
        booking_id: resData.id,
        reservation_code: resData.reservation_code,
        slot_code: resData.slot?.slot_code || "",
        plate: resData.vehicle_snapshot?.license_plate || "",
        vehicle_type: resData.vehicle_snapshot?.vehicle_type || "",
      });
      setQr(qrPayload);

      // Tính TTL từ expires_at
      if (resData.expires_at) {
        const expires = new Date(resData.expires_at).getTime();
        const now = Date.now();
        const remaining = Math.floor((expires - now) / 1000);
        setTtl(Math.max(0, remaining));
      } else {
        setTtl(900); // Default 15 phút
      }
    } catch (e: any) {
      console.error("Error loading reservation:", e);
      Alert.alert("Lỗi", "Không thể tải thông tin đặt chỗ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  // Đếm ngược timer
  useEffect(() => {
    if (ttl <= 0) return;
    const t = setInterval(() => {
      setTtl((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [ttl]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const getVehicleTypeLabel = (type?: string) => {
    if (!type) return "N/A";
    switch (type) {
      case "motorbike":
        return "Xe máy";
      case "car_4_seat":
        return "Ô tô 4 chỗ";
      case "car_7_seat":
        return "Ô tô 7 chỗ";
      case "light_truck":
        return "Xe tải nhẹ";
      default:
        return type;
    }
  };

  const getVehicleIcon = (type?: string) => {
    if (!type) return "car";
    return type === "motorbike" ? "bicycle" : "car";
  };

  return (
    <ScrollView
      className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between pt-12 pb-6 px-6">
        <Pressable
          onPress={() => router.back()}
          className="h-12 w-12 items-center justify-center bg-white rounded-full shadow-sm"
        >
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="text-2xl font-bold text-gray-800">QR CHECK-IN</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Quét mã để vào bãi xe
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/screens/tab/HomeScreen")}
          className="h-12 w-12 items-center justify-center bg-white rounded-full shadow-sm"
        >
          <Ionicons name="home" size={24} color="#374151" />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-white p-8 rounded-3xl shadow-lg items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-4 text-gray-700 font-medium text-center">
              Đang tải thông tin đặt chỗ...
            </Text>
          </View>
        </View>
      ) : (
        <View className="px-6">
          {/* QR Code Section */}
          <View className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <View className="items-center">
              <View className="flex-row items-center mb-6">
                <View className="bg-blue-100 p-3 rounded-full mr-4">
                  <Ionicons name="qr-code" size={24} color="#3b82f6" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-gray-800">
                    Mã QR Check-in
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Hiển thị cho nhân viên hoặc máy quét
                  </Text>
                </View>
              </View>

              {qr && ttl > 0 ? (
                <View className="items-center">
                  <View className="bg-white p-4 rounded-2xl shadow-sm border-2 border-gray-100">
                    <QRCode value={qr} size={200} />
                  </View>
                  <Text className="mt-4 text-gray-600 text-center text-sm leading-5 px-4">
                    Đưa QR này cho nhân viên hoặc máy quét để check-in vào bãi
                    xe
                  </Text>
                  <View className="mt-2 px-4 py-2 bg-amber-100 rounded-full">
                    <Text className="text-amber-800 font-medium text-xs">
                      Hết hạn sau {formatSeconds(ttl)}
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="items-center py-8">
                  <View className="bg-red-100 p-4 rounded-full mb-4">
                    <Ionicons name="alert-circle" size={32} color="#ef4444" />
                  </View>
                  <Text className="text-red-600 font-medium text-center">
                    QR Code đã hết hạn
                  </Text>
                  <Text className="text-red-500 text-sm text-center mt-2">
                    Vui lòng làm mới hoặc đặt chỗ mới
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Booking Details Card */}
          {reservation && (
            <View className="bg-white rounded-3xl shadow-lg p-6 mb-6">
              <View className="flex-row items-center mb-6">
                <View className="bg-green-100 p-3 rounded-full mr-4">
                  <Ionicons name="receipt" size={24} color="#10b981" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-gray-800">
                    Thông tin đặt chỗ
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Chi tiết booking của bạn
                  </Text>
                </View>
              </View>

              <View className="space-y-4">
                <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                  <View className="flex-row items-center">
                    <Ionicons name="barcode" size={20} color="#6b7280" />
                    <Text className="text-gray-600 font-medium ml-3">
                      Mã đặt chỗ
                    </Text>
                  </View>
                  <Text className="text-gray-800 font-semibold text-base">
                    {reservation.reservation_code}
                  </Text>
                </View>

                {reservation.slot && (
                  <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                    <View className="flex-row items-center">
                      <Ionicons name="location" size={20} color="#6b7280" />
                      <Text className="text-gray-600 font-medium ml-3">
                        Vị trí
                      </Text>
                    </View>
                    <Text className="text-gray-800 font-semibold text-base">
                      {reservation.slot.slot_code}
                    </Text>
                  </View>
                )}

                {reservation.vehicle_snapshot && (
                  <>
                    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                      <View className="flex-row items-center">
                        <Ionicons
                          name={getVehicleIcon(
                            reservation.vehicle_snapshot.vehicle_type
                          )}
                          size={20}
                          color="#6b7280"
                        />
                        <Text className="text-gray-600 font-medium ml-3">
                          Loại xe
                        </Text>
                      </View>
                      <Text className="text-gray-800 font-semibold text-base">
                        {getVehicleTypeLabel(
                          reservation.vehicle_snapshot.vehicle_type
                        )}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                      <View className="flex-row items-center">
                        <Ionicons name="card" size={20} color="#6b7280" />
                        <Text className="text-gray-600 font-medium ml-3">
                          Biển số
                        </Text>
                      </View>
                      <Text className="text-gray-800 font-semibold text-base">
                        {reservation.vehicle_snapshot.license_plate}
                      </Text>
                    </View>
                  </>
                )}

                <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                  <View className="flex-row items-center">
                    <Ionicons name="time" size={20} color="#6b7280" />
                    <Text className="text-gray-600 font-medium ml-3">
                      Bắt đầu
                    </Text>
                  </View>
                  <Text className="text-gray-800 font-semibold text-base">
                    {new Date(reservation.start_time).toLocaleString("vi-VN")}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-row items-center">
                    <Ionicons
                      name={
                        reservation.status === "confirmed"
                          ? "checkmark-circle"
                          : reservation.status === "checked_in"
                          ? "car"
                          : "time"
                      }
                      size={20}
                      color={
                        reservation.status === "confirmed"
                          ? "#10b981"
                          : reservation.status === "checked_in"
                          ? "#3b82f6"
                          : "#f59e0b"
                      }
                    />
                    <Text className="text-gray-600 font-medium ml-3">
                      Trạng thái
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full ${
                      reservation.status === "confirmed"
                        ? "bg-green-100"
                        : reservation.status === "checked_in"
                        ? "bg-blue-100"
                        : "bg-yellow-100"
                    }`}
                  >
                    <Text
                      className={`font-semibold text-sm ${
                        reservation.status === "confirmed"
                          ? "text-green-800"
                          : reservation.status === "checked_in"
                          ? "text-blue-800"
                          : "text-yellow-800"
                      }`}
                    >
                      {reservation.status === "confirmed"
                        ? "Đã xác nhận"
                        : reservation.status === "checked_in"
                        ? "Đã check-in"
                        : reservation.status}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Refresh Button */}
          <View className="mb-8">
            <Pressable
              onPress={onRefresh}
              className="h-14 rounded-2xl items-center justify-center shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600"
              style={({ pressed }) => [
                {
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View className="flex-row items-center">
                <Ionicons name="refresh" size={24} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  Làm mới thông tin
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
