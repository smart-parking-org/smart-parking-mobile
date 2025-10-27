import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiPayment } from "@/lib/api/client";

type ReservationDetails = {
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

export default function ConfirmBookingScreen() {
  const { reservationId, reservationCode } = useLocalSearchParams<{
    reservationId?: string;
    reservationCode?: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [reservation, setReservation] = useState<ReservationDetails | null>(
    null
  );
  const [checkingDetails, setCheckingDetails] = useState(true);

  useEffect(() => {
    if (reservationId && reservationCode) {
      // Đã có thông tin từ form, load chi tiết
      loadReservationDetails();
    } else {
      setCheckingDetails(false);
    }
  }, []);

  const loadReservationDetails = async () => {
    if (!reservationId) {
      Alert.alert("Lỗi", "Thiếu thông tin đặt chỗ");
      router.back();
      return;
    }

    try {
      setCheckingDetails(true);
      const { data } = await apiPayment.get<{ data: ReservationDetails }>(
        `/reservations/${reservationId}`
      );
      setReservation(data.data);
    } catch (error: any) {
      console.error("Error loading reservation:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải thông tin đặt chỗ");
    } finally {
      setCheckingDetails(false);
    }
  };

  const handleConfirm = async () => {
    if (!reservation) {
      Alert.alert("Lỗi", "Không có dữ liệu đặt chỗ");
      return;
    }

    try {
      setLoading(true);

      // KHÔNG lưu vào local storage nữa
      // Chỉ navigate thẳng tới QRScreen (tự động load từ DB)

      router.replace("/screens/tab/QRScreen");
    } catch (e: any) {
      console.error("Error in handleConfirm:", e);
      Alert.alert("Lỗi", e?.message || "Không thể xác nhận");
    } finally {
      setLoading(false);
    }
  };

  if (checkingDetails) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Đang tải thông tin...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding" })}
      className="flex-1 bg-gray-50"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-grow"
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
              Đặt chỗ thành công
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              Thông tin đặt chỗ của bạn
            </Text>
          </View>
          <View className="h-12 w-12" />
        </View>

        {/* Reservation Info Card */}
        {reservation && (
          <View className="mx-6 mb-6">
            <View className="bg-white rounded-3xl shadow-lg p-6">
              <View className="flex-row items-center mb-6">
                <View className="bg-green-100 p-3 rounded-full mr-4">
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-gray-800">
                    Đã xác nhận
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Thông tin chi tiết
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

                <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                  <View className="flex-row items-center">
                    <Ionicons name="calendar" size={20} color="#6b7280" />
                    <Text className="text-gray-600 font-medium ml-3">
                      Thời gian
                    </Text>
                  </View>
                  <Text className="text-gray-800 font-semibold text-base">
                    {new Date(reservation.start_time).toLocaleString("vi-VN")}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-row items-center">
                    <Ionicons name="car" size={20} color="#6b7280" />
                    <Text className="text-gray-600 font-medium ml-3">
                      Phương tiện
                    </Text>
                  </View>
                  <Text className="text-gray-800 font-semibold text-base">
                    {reservation.vehicle_snapshot?.license_plate || "N/A"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Confirm Button */}
        <View className="px-6 mb-8">
          <Pressable
            onPress={handleConfirm}
            disabled={loading}
            className="h-14 bg-blue-600 rounded-2xl items-center justify-center shadow-lg"
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            {loading ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  Đang xử lý...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="qr-code" size={24} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  Xem mã QR
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
