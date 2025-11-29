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
import { AppColor } from "@/lib/utils/color";
import { getVehicleIcon } from "@/app/screens/reservations/QRCheckInScreen";

type ReservationData = {
  id: number;
  reservation_code: string;
  status: string;
  start_time: string;
  end_time: string;
  slot?: {
    slot_code: string;
    vehicle_type: string;
    parking_lot?: {
      id: number;
      name: string;
    };
  };
  gate?: {
    id: number;
    parking_lot_id: number;
    gate_code: string;
    gate_type: "entry" | "exit" | "both";
    position_x: string;
    position_y: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
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
  reservation_request: {
    parking_lot: {
      id: number;
      name: string;
    };
  };
  distance_from_gate_meters?: number;
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

      // ✅ Kiểm tra các trạng thái thanh toán
      const isOfflinePayment =
        reservationData.payment?.meta?.payment_method === "offline";
      const isPaid = reservationData.payment?.status === "PAID";
      const isMonthlyPass = reservationData.payment?.meta?.is_free === true;
      const isCheckedIn = reservationData.status === "checked_in";
      const isPendingCheckout = reservationData.status === "pending_checkout";
      const isPendingPayment = reservationData.status === "pending_payment";

      // ✅ Xử lý checkoutCode
      // Nếu có checkoutCode từ params (từ check-in/checkout với monthly pass), sử dụng nó
      if (checkoutCode) {
        setCheckoutCodeFromAPI(checkoutCode);
      } else {
        // Dùng reservation_code làm QR code
        setCheckoutCodeFromAPI(null);
      }

      // ✅ Kiểm tra điều kiện hiển thị QR checkout
      // Có thể hiển thị QR nếu:
      // 1. Đã thanh toán online (PAID)
      // 2. Thanh toán trực tiếp (offline) - checked_in, pending_checkout hoặc pending_payment
      // 3. Có monthly pass (is_free = true)
      // 4. Status là pending_checkout (đã checkout, chờ quét)
      const canShowQR =
        isPaid ||
        (isOfflinePayment &&
          (isCheckedIn || isPendingCheckout || isPendingPayment)) ||
        isMonthlyPass ||
        isPendingCheckout;

      if (
        !canShowQR &&
        !isPendingPayment &&
        !(isCheckedIn && isOfflinePayment)
      ) {
        // Nếu chưa thanh toán và không phải pending_payment hoặc checked_in với offline payment, yêu cầu thanh toán
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

      // Nếu đang pending_payment, có thể cho phép xem nhưng hiển thị thông báo
      if (isPendingPayment && !isPaid && !isOfflinePayment) {
        // Có thể hiển thị nhưng sẽ có thông báo ở dưới
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

  const getGateTypeLabel = (type?: string) => {
    if (!type) return "N/A";
    switch (type) {
      case "entry":
        return "Vào";
      case "exit":
        return "Ra";
      case "both":
        return "Vào/Ra";
      default:
        return type;
    }
  };

  const calculateDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diffMs = end - start;
    const diffMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    if (hours > 0 && minutes > 0) return `${hours} giờ ${minutes} phút`;
    if (hours > 0) return `${hours} giờ`;
    return `${minutes} phút`;
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

  // ✅ Kiểm tra các trạng thái thanh toán và reservation
  const isOfflinePayment =
    reservation.payment?.meta?.payment_method === "offline";
  const isPaid = reservation.payment?.status === "PAID";
  const isMonthlyPass = reservation.payment?.meta?.is_free === true;
  const isCheckedIn = reservation.status === "checked_in";
  const isPendingCheckout = reservation.status === "pending_checkout";
  const isPendingPayment = reservation.status === "pending_payment";
  // ✅ Hiển thị số tiền cho offline payment chưa PAID (cả checked_in, pending_payment và pending_checkout)
  const isPendingOffline =
    isOfflinePayment &&
    !isPaid &&
    (isCheckedIn || isPendingCheckout || isPendingPayment);

  // ✅ Kiểm tra điều kiện hiển thị QR checkout
  // Cho phép hiển thị QR nếu:
  // 1. Đã thanh toán online (PAID)
  // 2. Thanh toán trực tiếp (offline) - checked_in, pending_checkout hoặc pending_payment
  // 3. Có monthly pass (is_free = true)
  // 4. Status là pending_checkout (đã checkout, chờ quét)
  const canShowQR =
    isPaid ||
    (isOfflinePayment &&
      (isCheckedIn || isPendingCheckout || isPendingPayment)) ||
    isMonthlyPass ||
    isPendingCheckout;

  // Nếu không thể hiển thị QR và không phải pending_payment hoặc checked_in với offline payment, hiển thị lỗi
  if (!canShowQR && !isPendingPayment && !(isCheckedIn && isOfflinePayment)) {
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
      <View className="flex-1">
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
                      Hiển thị cho nhân viên hoặc máy quét abc
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
                    <Ionicons name="business" size={20} color="#6b7280" />
                    <Text className="text-gray-600 font-medium ml-3">
                      Bãi đỗ
                    </Text>
                  </View>
                  <Text className="text-gray-800 font-semibold text-base">
                    {reservation.reservation_request.parking_lot.name || "N/A"}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                  <View className="flex-row items-center">
                    <Ionicons
                      name="trail-sign-outline"
                      size={20}
                      color="#6b7280"
                    />
                    <Text className="text-gray-600 font-medium ml-3">Cổng</Text>
                  </View>
                  <Text className="text-gray-800 font-semibold text-base">
                    {reservation?.gate?.gate_code || "N/A"}
                    {reservation?.gate?.gate_type &&
                      getGateTypeLabel(reservation.gate.gate_type)}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                  <View className="flex-row items-center">
                    <Ionicons name="location" size={20} color="#6b7280" />
                    <Text className="text-gray-600 font-medium ml-3">
                      Vị trí
                    </Text>
                  </View>
                  <Text className="text-gray-800 font-semibold text-base">
                    {reservation?.slot?.slot_code || "N/A"}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                  <View className="flex-row items-center">
                    <Ionicons
                      name="navigate-outline"
                      size={20}
                      color="#6b7280"
                    />
                    <Text className="text-gray-600 font-medium ml-3">
                      Khoảng cách từ vị trí đỗ đến cổng
                    </Text>
                  </View>
                  <Text className="text-gray-800 font-semibold text-base">
                    {reservation?.distance_from_gate_meters || "N/A"} (m)
                  </Text>
                </View>

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

                {reservation.end_time && (
                  <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={20} color="#6b7280" />
                      <Text className="text-gray-600 font-medium ml-3">
                        Kết thúc
                      </Text>
                    </View>
                    <Text className="text-gray-800 font-semibold text-base">
                      {new Date(reservation.end_time).toLocaleString("vi-VN")}
                    </Text>
                  </View>
                )}

                {reservation.start_time && reservation.end_time && (
                  <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                    <View className="flex-row items-center">
                      <Ionicons name="hourglass" size={20} color="#6b7280" />
                      <Text className="text-gray-600 font-medium ml-3">
                        Thời lượng đỗ
                      </Text>
                    </View>
                    <Text className="text-gray-800 font-semibold text-base">
                      {calculateDuration(
                        reservation.start_time,
                        reservation.end_time
                      )}
                    </Text>
                  </View>
                )}

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
      </View>
    </>
  );
}
