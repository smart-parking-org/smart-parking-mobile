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
import { getCheckoutCode } from "@/lib/api/booking";
import { apiPayment } from "@/lib/api/client";

type CheckoutCodeData = {
  checkout_code: string;
  status: string;
  expires_at?: string;
  qr_data: string;
};

type ReservationData = {
  id: number;
  reservation_code: string;
  status: string;
  slot?: {
    slot_code: string;
  };
  vehicle_snapshot?: {
    license_plate: string;
    vehicle_type: string;
  };
};

export default function QRCheckoutScreen() {
  const { reservationId } = useLocalSearchParams<{
    reservationId: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [checkoutCode, setCheckoutCode] = useState<CheckoutCodeData | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const [ttl, setTtl] = useState(0);

  const formatSeconds = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  const load = useCallback(async () => {
    if (!reservationId) return;

    try {
      setLoading(true);

      // Load reservation details
      const resResponse = await apiPayment.get<{ data: ReservationData }>(
        `/reservations/${reservationId}`
      );
      setReservation(resResponse.data.data);

      // Load checkout code
      const codeResponse = await getCheckoutCode(parseInt(reservationId));
      setCheckoutCode(codeResponse.data);

      // Tính TTL từ expires_at
      if (codeResponse.data.expires_at) {
        const expires = new Date(codeResponse.data.expires_at).getTime();
        const now = Date.now();
        const remaining = Math.floor((expires - now) / 1000);
        setTtl(Math.max(0, remaining));
      } else {
        setTtl(86400); // Default 24 giờ
      }
    } catch (e: any) {
      console.error("Error loading checkout code:", e);
      Alert.alert(
        "Lỗi",
        e.response?.data?.message ||
          "Không thể tải mã QR checkout. Vui lòng thử lại."
      );
      if (e.response?.status === 404) {
        router.back();
      }
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-white p-8 rounded-3xl shadow-lg items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-700 font-medium text-center">
            Đang tải mã QR checkout...
          </Text>
        </View>
      </View>
    );
  }

  if (!checkoutCode || !reservation) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-white p-8 rounded-3xl shadow-lg items-center">
          <View className="bg-red-100 p-4 rounded-full mb-4">
            <Ionicons name="alert-circle" size={32} color="#ef4444" />
          </View>
          <Text className="text-red-600 font-medium text-center">
            Không tìm thấy mã QR checkout
          </Text>
          <Text className="text-red-500 text-sm text-center mt-2">
            Vui lòng thanh toán trước để nhận mã QR
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-6 px-6 py-3 bg-blue-600 rounded-full"
          >
            <Text className="text-white font-bold">Quay lại</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gradient-to-br from-green-50 to-emerald-100"
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
          <Text className="text-2xl font-bold text-gray-800">
            QR CHECKOUT
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            Quét mã để ra khỏi bãi xe
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/screens/tab/HomeScreen")}
          className="h-12 w-12 items-center justify-center bg-white rounded-full shadow-sm"
        >
          <Ionicons name="home" size={24} color="#374151" />
        </Pressable>
      </View>

      <View className="px-6">
        {/* QR Code Section */}
        <View className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <View className="items-center">
            <View className="flex-row items-center mb-6">
              <View className="bg-green-100 p-3 rounded-full mr-4">
                <Ionicons name="qr-code" size={24} color="#10b981" />
              </View>
              <View>
                <Text className="text-lg font-bold text-gray-800">
                  Mã QR Checkout
                </Text>
                <Text className="text-sm text-gray-500">
                  Hiển thị cho nhân viên hoặc máy quét
                </Text>
              </View>
            </View>

            {checkoutCode.qr_data && ttl > 0 ? (
              <View className="items-center">
                <View className="bg-white p-4 rounded-2xl shadow-sm border-2 border-gray-100">
                  <QRCode value={checkoutCode.qr_data} size={200} />
                </View>
                <Text className="mt-4 text-gray-600 text-center text-sm leading-5 px-4">
                  Đưa QR này cho nhân viên hoặc máy quét tại cổng ra để hoàn tất
                  checkout
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
                  Vui lòng làm mới hoặc liên hệ nhân viên
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Checkout Code Info */}
        <View className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <View className="flex-row items-center mb-6">
            <View className="bg-blue-100 p-3 rounded-full mr-4">
              <Ionicons name="receipt" size={24} color="#3b82f6" />
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-800">
                Thông tin checkout
              </Text>
              <Text className="text-sm text-gray-500">
                Chi tiết mã checkout
              </Text>
            </View>
          </View>

          <View className="space-y-4">
            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <View className="flex-row items-center">
                <Ionicons name="barcode" size={20} color="#6b7280" />
                <Text className="text-gray-600 font-medium ml-3">
                  Mã checkout
                </Text>
              </View>
              <Text className="text-gray-800 font-semibold text-base">
                {checkoutCode.checkout_code}
              </Text>
            </View>

            {reservation.slot && (
              <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                <View className="flex-row items-center">
                  <Ionicons name="location" size={20} color="#6b7280" />
                  <Text className="text-gray-600 font-medium ml-3">Vị trí</Text>
                </View>
                <Text className="text-gray-800 font-semibold text-base">
                  {reservation.slot.slot_code}
                </Text>
              </View>
            )}

            {reservation.vehicle_snapshot && (
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
            )}

            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center">
                <Ionicons
                  name={
                    checkoutCode.status === "active"
                      ? "checkmark-circle"
                      : "time"
                  }
                  size={20}
                  color={
                    checkoutCode.status === "active" ? "#10b981" : "#f59e0b"
                  }
                />
                <Text className="text-gray-600 font-medium ml-3">
                  Trạng thái
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  checkoutCode.status === "active"
                    ? "bg-green-100"
                    : "bg-yellow-100"
                }`}
              >
                <Text
                  className={`font-semibold text-sm ${
                    checkoutCode.status === "active"
                      ? "text-green-800"
                      : "text-yellow-800"
                  }`}
                >
                  {checkoutCode.status === "active" ? "Hoạt động" : "Đã sử dụng"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View className="bg-blue-50 rounded-3xl p-6 mb-8">
          <View className="flex-row items-start mb-4">
            <Ionicons name="information-circle" size={24} color="#3b82f6" />
            <Text className="text-blue-800 font-bold text-base ml-3 flex-1">
              Hướng dẫn sử dụng
            </Text>
          </View>
          <View className="space-y-2">
            <View className="flex-row items-start">
              <Text className="text-blue-700 text-sm">1. </Text>
              <Text className="text-blue-700 text-sm flex-1">
                Đến cổng ra của bãi đỗ xe
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-blue-700 text-sm">2. </Text>
              <Text className="text-blue-700 text-sm flex-1">
                Hiển thị mã QR này cho nhân viên hoặc máy quét
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-blue-700 text-sm">3. </Text>
              <Text className="text-blue-700 text-sm flex-1">
                Sau khi quét thành công, cổng sẽ tự động mở
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

