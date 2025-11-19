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
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { apiPayment } from "@/lib/api/client";
import { PageHeader } from "../../components/common/PageHeader";
import { AppColor } from "@/lib/utils/color";

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
  payment?: {
    id: number;
    amount: number;
    status: string; // 'PAID' hoặc 'PENDING'
    meta?: {
      payment_method?: string; // 'online' hoặc 'offline'
      is_free?: boolean;
      monthly_pass_id?: number;
    };
  } | null;
};

export default function QRCheckoutScreen() {
  const { reservationId, checkoutCode } = useLocalSearchParams<{
    reservationId: string;
    checkoutCode?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [checkoutCodeFromAPI, setCheckoutCodeFromAPI] = useState<string | null>(
    checkoutCode || null
  );

  const load = useCallback(async () => {
    if (!reservationId) return;

    try {
      setLoading(true);

      // Load reservation details (bao gồm payment)
      const resResponse = await apiPayment.get<{ data: ReservationData }>(
        `/reservations/${reservationId}`
      );
      const reservationData = resResponse.data.data;
      setReservation(reservationData);

      // ✅ Kiểm tra: Nếu thanh toán trực tiếp (offline) hoặc đã thanh toán online (PAID)
      const isOfflinePayment =
        reservationData.payment?.meta?.payment_method === "offline";
      const isPaid = reservationData.payment?.status === "PAID";
      const isMonthlyPass = reservationData.payment?.meta?.is_free === true;

      // ✅ Không cần lấy checkout code nữa, dùng reservation_code
      // Nếu có checkoutCode từ params (từ check-in với monthly pass), sử dụng nó
      if (checkoutCode) {
        setCheckoutCodeFromAPI(checkoutCode);
      } else {
        // Dùng reservation_code làm QR code
        setCheckoutCodeFromAPI(null);
      }

      if (!isOfflinePayment && !isPaid && !isMonthlyPass) {
        Alert.alert(
          "Lỗi",
          "Vui lòng thanh toán trước để nhận mã QR checkout.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
        return;
      }
    } catch (e: any) {
      console.error("Error loading reservation:", e);
      Alert.alert(
        "Lỗi",
        e.response?.data?.message ||
          "Không thể tải thông tin đặt chỗ. Vui lòng thử lại."
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

  // Kiểm tra reservation và payment status
  if (!reservation) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-white p-8 rounded-3xl shadow-lg items-center">
          <View className="bg-red-100 p-4 rounded-full mb-4">
            <Ionicons name="alert-circle" size={32} color="#ef4444" />
          </View>
          <Text className="text-red-600 font-medium text-center">
            Không tìm thấy thông tin đặt chỗ
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

  // ✅ Kiểm tra payment đã thanh toán chưa (hoặc thanh toán trực tiếp)
  const isOfflinePayment =
    reservation.payment?.meta?.payment_method === "offline";
  const isPaid = reservation.payment?.status === "PAID";
  const isPendingOffline = isOfflinePayment && !isPaid;

  if (!isOfflinePayment && !isPaid) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-white p-8 rounded-3xl shadow-lg items-center">
          <View className="bg-amber-100 p-4 rounded-full mb-4">
            <Ionicons name="alert-circle" size={32} color="#f59e0b" />
          </View>
          <Text className="text-amber-800 font-medium text-center">
            Chưa thanh toán
          </Text>
          <Text className="text-amber-600 text-sm text-center mt-2">
            Vui lòng thanh toán trước để nhận mã QR checkout
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
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "CHECK-OUT",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: AppColor.PRIMARY },
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: "800",
            fontSize: 16,
            color: "#fff",
          },
          headerTintColor: "#fff",
          headerBackVisible: true,
        }}
      />
      <ScrollView
        className="flex-1 bg-gradient-to-br from-green-50 to-emerald-100"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 mt-6">
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

              {/* Sử dụng checkout_code nếu có, nếu không thì dùng reservation_code */}
              {checkoutCodeFromAPI || reservation.reservation_code ? (
                <View className="items-center">
                  <View className="bg-white p-4 rounded-2xl shadow-sm border-2 border-gray-100">
                    <QRCode
                      value={
                        checkoutCodeFromAPI ||
                        reservation.reservation_code ||
                        ""
                      }
                      size={200}
                    />
                  </View>
                  <Text className="mt-4 text-gray-600 text-center text-sm leading-5 px-4">
                    Đưa QR này cho nhân viên hoặc máy quét tại cổng ra để hoàn
                    tất checkout
                  </Text>
                  {checkoutCodeFromAPI && (
                    <View className="mt-2 px-4 py-2 bg-green-100 rounded-full">
                      <Text className="text-green-800 font-medium text-xs">
                        Vé tháng đã được áp dụng - Miễn phí
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View className="items-center py-8">
                  <View className="bg-red-100 p-4 rounded-full mb-4">
                    <Ionicons name="alert-circle" size={32} color="#ef4444" />
                  </View>
                  <Text className="text-red-600 font-medium text-center">
                    Không có mã QR
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Hiển thị số tiền cần thu cho offline payment chưa PAID */}
          {isPendingOffline && reservation.payment && (
            <View className="bg-amber-50 border-2 border-amber-200 rounded-3xl shadow-lg p-6 mb-6">
              <View className="flex-row items-center mb-4">
                <View className="bg-amber-100 p-3 rounded-full mr-4">
                  <Ionicons name="cash" size={24} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-amber-900">
                    Thanh toán
                  </Text>
                  <Text className="text-sm text-amber-700 mt-1">
                    Thanh toán trực tiếp - Chưa xác nhận
                  </Text>
                </View>
              </View>
              <View className="bg-white rounded-2xl p-4 mt-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700 font-medium text-base">
                    Số tiền cần thanh toán:
                  </Text>
                  <Text className="text-2xl font-bold text-amber-600">
                    {reservation.payment.amount.toLocaleString("vi-VN")} đ
                  </Text>
                </View>
              </View>
              <View className="mt-4 bg-amber-100 rounded-xl p-3">
                <Text className="text-amber-800 text-sm text-center">
                  ⚠️ Vui lòng thanh toán trước khi quét QR checkout
                </Text>
              </View>
            </View>
          )}

          {/* Reservation Code Info */}
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
                  Chi tiết mã đặt chỗ
                </Text>
              </View>
            </View>

            <View className="space-y-4">
              {/* Hiển thị reservation_code thay vì checkout_code */}
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

              {/* Hiển thị trạng thái thanh toán */}
              <View className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center">
                  <Ionicons
                    name={isPaid ? "checkmark-circle" : "time"}
                    size={20}
                    color={isPaid ? "#10b981" : "#f59e0b"}
                  />
                  <Text className="text-gray-600 font-medium ml-3">
                    Trạng thái thanh toán
                  </Text>
                </View>
                <View
                  className={`px-3 py-1 rounded-full ${
                    isPaid ? "bg-green-100" : "bg-amber-100"
                  }`}
                >
                  <Text
                    className={`font-semibold text-sm ${
                      isPaid ? "text-green-800" : "text-amber-800"
                    }`}
                  >
                    {isPaid
                      ? isOfflinePayment
                        ? "Đã thanh toán trực tiếp"
                        : "Đã thanh toán"
                      : "Chờ thanh toán"}
                  </Text>
                </View>
              </View>

              {/* Hiển thị số tiền nếu chưa PAID */}
              {!isPaid && reservation.payment && (
                <View className="flex-row items-center justify-between py-3 border-t border-gray-100 mt-2">
                  <View className="flex-row items-center">
                    <Ionicons name="cash" size={20} color="#f59e0b" />
                    <Text className="text-gray-600 font-medium ml-3">
                      Số tiền
                    </Text>
                  </View>
                  <Text className="text-amber-600 font-bold text-lg">
                    {reservation.payment.amount.toLocaleString("vi-VN")} đ
                  </Text>
                </View>
              )}
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
    </>
  );
}
