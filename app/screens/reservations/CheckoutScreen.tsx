import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiPayment } from "@/lib/api/client";
import { checkOutReservation } from "@/lib/api/booking";

type ReservationDetails = {
  id: number;
  reservation_code: string;
  status: string;
  check_in_at?: string;
  check_out_at?: string | null;
  pricing_snapshot?: {
    hourly: number;
    daily_cap: number;
    peak_enabled: boolean;
    peak_multiplier: number;
    rounding_minutes: number;
  };
  vehicle_snapshot?: {
    license_plate: string;
    vehicle_type: string;
  };
  slot?: {
    slot_code: string;
  };
  start_time: string;
  end_time: string;
};

export default function CheckoutScreen() {
  const { reservationId } = useLocalSearchParams<{
    reservationId: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reservation, setReservation] = useState<ReservationDetails | null>(
    null
  );
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    loadReservationDetails();
  }, []);

  const loadReservationDetails = async () => {
    if (!reservationId) return;

    try {
      setLoading(true);
      const { data } = await apiPayment.get<{ data: ReservationDetails }>(
        `/reservations/${reservationId}`
      );
      setReservation(data.data);

      // Tính tiền dựa trên thời gian thực tế
      const calculatedAmount = calculateAmount(data.data);
      setAmount(calculatedAmount);
    } catch (error: any) {
      console.error("Error loading reservation:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin đặt chỗ");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const calculateAmount = (reservation: ReservationDetails): number => {
    if (!reservation.pricing_snapshot) return 0;

    const pricing = reservation.pricing_snapshot;

    // Tính số giờ đã đặt ban đầu (từ start_time đến end_time)
    const startTime = new Date(reservation.start_time);
    const endTime = new Date(reservation.end_time);
    const bookedDurationMinutes = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 60000
    );
    const bookedHours = bookedDurationMinutes / 60;

    // Nếu chưa checkout (chưa có check_out_at) → tính theo số giờ đã đặt
    // Nếu đã checkout (có check_out_at) → kiểm tra xem có lố quá không
    let billableHours = bookedHours;
    
    if (reservation.check_out_at) {
      // Đã checkout, kiểm tra xem có lố quá số giờ đã đặt không
      const checkIn = new Date(reservation.check_in_at || reservation.start_time);
      const checkOut = new Date(reservation.check_out_at);
      const actualDurationMinutes = Math.floor(
        (checkOut.getTime() - checkIn.getTime()) / 60000
      );
      const actualHours = actualDurationMinutes / 60;

      // Nếu thời gian thực tế > thời gian đã đặt → tính thêm 1 giờ
      if (actualHours > bookedHours) {
        billableHours = bookedHours + 1;
      }
    }
    // Nếu chưa checkout → billableHours = bookedHours (số giờ đã đặt)

    // Giá cơ bản: số giờ tính × hourly
    let totalAmount = pricing.hourly * billableHours;

    // Áp dụng peak multiplier nếu có
    if (pricing.peak_enabled && pricing.peak_multiplier) {
      totalAmount = totalAmount * pricing.peak_multiplier;
    }

    // Áp dụng daily cap
    if (pricing.daily_cap && totalAmount > pricing.daily_cap) {
      totalAmount = pricing.daily_cap;
    }

    return Math.ceil(totalAmount);
  };

  const handleCheckout = async (paymentMethod: "online" | "offline") => {
    if (!reservation || amount === 0 || !reservationId) {
      Alert.alert("Lỗi", "Số tiền thanh toán không hợp lệ");
      return;
    }

    try {
      setProcessing(true);

      // Gọi API checkout với payment_method
      const response = await checkOutReservation(
        parseInt(reservationId),
        paymentMethod
      );

      if (paymentMethod === "offline") {
        // Thanh toán trực tiếp → checked_out ngay
        Alert.alert(
          "Checkout thành công!",
          "Bạn đã thanh toán trực tiếp. Cảm ơn bạn đã sử dụng dịch vụ.",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace("/screens/tab/QRScreen");
              },
            },
          ]
        );
      } else {
        // Thanh toán online → pending_checkout → Navigate tới PaymentScreen
        router.replace({
          pathname: "/screens/reservations/PaymentScreen",
          params: {
            reservationId: reservationId,
          },
        });
      }
    } catch (error: any) {
      console.error("Error during checkout:", error);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể thực hiện checkout"
      );
    } finally {
      setProcessing(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 12, color: "#6b7280" }}>Đang tải...</Text>
      </View>
    );
  }

  if (!reservation) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={{ marginTop: 12, color: "#6b7280" }}>
          Không tìm thấy thông tin đặt chỗ
        </Text>
      </View>
    );
  }

  const duration = reservation.check_in_at
    ? Math.floor(
        (new Date().getTime() - new Date(reservation.check_in_at).getTime()) /
          60000
      )
    : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <View className="flex-row items-center justify-between pt-12 pb-6 px-6">
        <Pressable
          onPress={() => router.back()}
          className="h-12 w-12 items-center justify-center bg-white rounded-full shadow-sm"
        >
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="text-2xl font-bold text-gray-800">CHECKOUT</Text>
        </View>
        <Pressable
          onPress={() => router.push("/screens/tab/HomeScreen")}
          className="h-12 w-12 items-center justify-center bg-white rounded-full shadow-sm"
        >
          <Ionicons name="home" size={24} color="#374151" />
        </Pressable>
      </View>

      <View style={{ padding: 24 }}>
        {/* Reservation Info */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
            Mã đặt chỗ
          </Text>
          <View
            style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}
          >
            <Ionicons name="qr-code-outline" size={20} color="#6b7280" />
            <Text style={{ marginLeft: 8, color: "#6b7280" }}>
              {reservation.reservation_code}
            </Text>
          </View>
        </View>

        {/* Chi tiết đơn hàng */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
            Chi tiết đơn hàng
          </Text>

          <View style={{ gap: 12 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ color: "#6b7280" }}>Vị trí</Text>
              <Text style={{ fontWeight: "600" }}>
                {reservation.slot?.slot_code || "N/A"}
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ color: "#6b7280" }}>Biển số</Text>
              <Text style={{ fontWeight: "600" }}>
                {reservation.vehicle_snapshot?.license_plate || "N/A"}
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ color: "#6b7280" }}>Thời gian đỗ</Text>
              <Text style={{ fontWeight: "600" }}>
                {formatDuration(duration)}
              </Text>
            </View>
          </View>
        </View>

        {/* Tổng tiền */}
        <View
          style={{
            backgroundColor: "#3b82f6",
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
              Tổng cộng
            </Text>
            <Text style={{ color: "white", fontSize: 32, fontWeight: "bold" }}>
              {amount.toLocaleString("vi-VN")} đ
            </Text>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
            Chọn phương thức thanh toán
          </Text>

          {/* Thông báo nếu số tiền < 10.000 */}
          {amount < 10000 && (
            <View
              style={{
                backgroundColor: "#fef3c7",
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="information-circle" size={20} color="#f59e0b" />
              <Text
                style={{
                  color: "#92400e",
                  fontSize: 14,
                  marginLeft: 8,
                  flex: 1,
                }}
              >
                Số tiền dưới 10.000đ chỉ có thể thanh toán trực tiếp tại bãi
                xe
              </Text>
            </View>
          )}

          {/* Online Payment Button - chỉ hiển thị khi amount >= 10000 */}
          {amount >= 10000 && (
            <TouchableOpacity
              onPress={() => handleCheckout("online")}
              disabled={processing}
              style={{
                backgroundColor: processing ? "#9ca3af" : "#10b981",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {processing ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="card" size={24} color="white" />
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 18,
                      marginLeft: 8,
                    }}
                  >
                    Thanh toán trực tuyến
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Offline Payment Button */}
          <TouchableOpacity
            onPress={() => handleCheckout("offline")}
            disabled={processing}
            style={{
              backgroundColor: processing ? "#9ca3af" : "#3b82f6",
              borderRadius: 12,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {processing ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="cash" size={24} color="white" />
                <Text
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: 18,
                    marginLeft: 8,
                  }}
                >
                  Thanh toán trực tiếp
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Info */}
        {amount >= 10000 && (
          <View style={{ marginTop: 8, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <Text style={{ marginLeft: 8, color: "#6b7280", fontSize: 14 }}>
                Thanh toán trực tuyến sẽ tạo mã QR để quét tại cổng ra
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

