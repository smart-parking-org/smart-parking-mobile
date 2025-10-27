import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiPayment } from "@/lib/api/client";

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

export default function PaymentScreen() {
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

    // Tính thời gian đỗ
    const checkIn = new Date(reservation.check_in_at || reservation.start_time);
    const checkOut = new Date(
      reservation.check_out_at || reservation.end_time || new Date()
    );
    const durationMinutes = Math.floor(
      (checkOut.getTime() - checkIn.getTime()) / 60000
    );

    // Làm tròn theo rounding_minutes
    const roundingMinutes = pricing.rounding_minutes || 30;
    const roundedMinutes =
      Math.ceil(durationMinutes / roundingMinutes) * roundingMinutes;

    // Tính giờ
    const hours = roundedMinutes / 60;

    // Giá cơ bản
    let totalAmount = pricing.hourly * hours;

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

  const handlePayment = async () => {
    if (!reservation || amount === 0) {
      Alert.alert("Lỗi", "Số tiền thanh toán không hợp lệ");
      return;
    }

    try {
      setProcessing(true);

      // 1. Tạo payment link từ VNPAY
      const response = await apiPayment.post("/payments/create", {
        order_id: reservation.reservation_code,
        amount: amount,
        bank_code: null,
      });

      const { payUrl, txnRef } = response.data;

      console.log("🔗 Payment URL:", payUrl);

      // 2. Mở browser với payment URL
      const canOpen = await Linking.canOpenURL(payUrl);
      if (canOpen) {
        await Linking.openURL(payUrl);

        // 3. Hiển thị thông báo
        Alert.alert(
          "Đang xử lý thanh toán",
          "Vui lòng hoàn tất thanh toán trên trình duyệt. Bạn sẽ được quay lại app sau khi thanh toán xong.",
          [
            {
              text: "Đã thanh toán",
              onPress: () => {
                // Check payment status và check-out
                pollAndCheckout();
              },
            },
            { text: "Hủy", style: "cancel" },
          ]
        );
      } else {
        Alert.alert("Lỗi", "Không thể mở trình duyệt thanh toán");
      }
    } catch (error: any) {
      console.error("Error creating payment:", error);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể tạo đơn thanh toán"
      );
    } finally {
      setProcessing(false);
    }
  };

  const pollAndCheckout = async () => {
    if (!reservationId) return;

    try {
      Alert.alert("Đang xác nhận thanh toán", "Vui lòng chờ...");

      // Gọi API check-out (backend sẽ tự tính tiền và tạo payment)
      await apiPayment.put(`/reservations/${reservationId}/check-out`);

      Alert.alert("Thanh toán thành công!", "Cảm ơn bạn đã sử dụng dịch vụ.", [
        {
          text: "OK",
          onPress: () => router.push("/screens/tab/QRScreen"),
        },
      ]);
    } catch (error: any) {
      console.error("Error during checkout:", error);
      Alert.alert("Lỗi", "Không thể xác nhận thanh toán");
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
      <View style={{ padding: 24 }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
            Thanh toán
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

        {/* Giá dịch vụ */}
        {reservation.pricing_snapshot && (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}
            >
              Bảng giá
            </Text>

            <View style={{ gap: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: "#6b7280" }}>Giá theo giờ</Text>
                <Text style={{ fontWeight: "600" }}>
                  {reservation.pricing_snapshot.hourly.toLocaleString("vi-VN")}{" "}
                  đ/giờ
                </Text>
              </View>

              {reservation.pricing_snapshot.daily_cap && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: "#6b7280" }}>Trần giá/ngày</Text>
                  <Text style={{ fontWeight: "600" }}>
                    {reservation.pricing_snapshot.daily_cap.toLocaleString(
                      "vi-VN"
                    )}{" "}
                    đ
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tổng tiền */}
        <View
          style={{
            backgroundColor: "#3b82f6",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
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

        {/* Button thanh toán */}
        <TouchableOpacity
          onPress={handlePayment}
          disabled={processing}
          style={{
            backgroundColor: processing ? "#9ca3af" : "#10b981",
            borderRadius: 16,
            padding: 16,
            alignItems: "center",
          }}
        >
          {processing ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="card" size={24} color="white" />
              <Text
                style={{
                  color: "white",
                  fontWeight: "bold",
                  fontSize: 18,
                  marginLeft: 8,
                }}
              >
                Thanh toán qua VNPAY
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Info */}
        <View style={{ marginTop: 16, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="shield-checkmark" size={20} color="#6b7280" />
            <Text style={{ marginLeft: 8, color: "#6b7280", fontSize: 14 }}>
              Thanh toán an toàn với VNPAY
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
