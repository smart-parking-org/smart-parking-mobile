import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking, // ✅ Từ react-native (dùng cho canOpenURL, openURL)
  AppState,
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiPayment } from "@/lib/api/client";
import * as ExpoLinking from "expo-linking"; // ✅ Đổi tên thành ExpoLinking

type ReservationDetails = {
  id: number;
  reservation_code: string;
  status: string;
  check_in_at?: string;
  check_out_at?: string | null;
  payment_id?: number;
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
  payment?: {
    id: number;
    amount: number;
    status: string;
  };
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

  // ✅ Xử lý deep link từ VNPAY
  const handleDeepLink = useCallback(async ({ url }: { url: string }) => {
    try {
      // ✅ Sử dụng ExpoLinking.parse()
      const parsed = ExpoLinking.parse(url);

      if (parsed.path === "payment/result" || url.includes("payment/result")) {
        const params = parsed.queryParams;
        const status = params?.status as string;
        const reservationIdFromLink = params?.reservation_id as string;

        if (status === "PAID" && reservationIdFromLink) {
          // Navigate tới QRCheckoutScreen để hiển thị QR code
          router.replace({
            pathname: "/screens/reservations/QRCheckoutScreen",
            params: {
              reservationId: reservationIdFromLink,
            },
          });
        } else if (status === "FAILED") {
          Alert.alert(
            "Thanh toán thất bại",
            "Vui lòng thử lại hoặc chọn phương thức thanh toán khác."
          );
        }
      }
    } catch (error) {
      console.error("Error handling deep link:", error);
    }
  }, []);

  useEffect(() => {
    loadReservationDetails();

    // ✅ Lắng nghe deep link khi app được mở từ VNPAY
    const subscription = ExpoLinking.addEventListener("url", handleDeepLink);

    // ✅ Kiểm tra URL khi app mở (nếu app đã mở sẵn)
    ExpoLinking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // ✅ Lắng nghe khi app quay lại foreground
    const subscriptionAppState = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") {
          // Khi app active, event listener sẽ tự động bắt deep link
          // Không cần check thủ công vì addEventListener đã xử lý
        }
      }
    );

    return () => {
      subscription.remove();
      subscriptionAppState.remove();
    };
  }, [handleDeepLink]);

  const loadReservationDetails = async () => {
    if (!reservationId) return;

    try {
      setLoading(true);
      const { data } = await apiPayment.get<{ data: ReservationDetails }>(
        `/reservations/${reservationId}`
      );
      setReservation(data.data);

      console.log("📋 Reservation data:", JSON.stringify(data.data, null, 2));

      // Nếu đã có payment (status = pending_checkout), lấy amount từ payment
      if (data.data.payment && data.data.payment.amount) {
        console.log("💰 Using amount from payment:", data.data.payment.amount);
        setAmount(data.data.payment.amount);
      } else if (data.data.payment_id) {
        // Nếu có payment_id nhưng chưa load payment, load payment để lấy amount
        try {
          const paymentResponse = await apiPayment.get(
            `/payments/by-order/${data.data.reservation_code}`
          );
          if (paymentResponse.data && paymentResponse.data.amount) {
            console.log(
              "💰 Using amount from loaded payment:",
              paymentResponse.data.amount
            );
            setAmount(paymentResponse.data.amount);
          } else {
            // Fallback: tính lại từ pricing_snapshot
            const calculatedAmount = calculateAmount(data.data);
            console.log("💰 Calculated amount:", calculatedAmount);
            setAmount(calculatedAmount);
          }
        } catch (paymentError) {
          console.error("Error loading payment:", paymentError);
          // Fallback: tính lại từ pricing_snapshot
          const calculatedAmount = calculateAmount(data.data);
          console.log("💰 Calculated amount (fallback):", calculatedAmount);
          setAmount(calculatedAmount);
        }
      } else {
        // Chưa có payment, tính tiền dựa trên thời gian thực tế
        const calculatedAmount = calculateAmount(data.data);
        console.log("💰 Calculated amount:", calculatedAmount);
        setAmount(calculatedAmount);
      }
    } catch (error: any) {
      console.error("Error loading reservation:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin đặt chỗ");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const calculateAmount = (reservation: ReservationDetails): number => {
    if (!reservation.pricing_snapshot) {
      console.warn("⚠️ No pricing_snapshot found in reservation");
      return 0;
    }

    const pricing = reservation.pricing_snapshot;
    console.log("💵 Pricing snapshot:", pricing);

    // Tính số giờ đã đặt ban đầu (từ start_time đến end_time)
    const startTime = new Date(reservation.start_time);
    const endTime = new Date(reservation.end_time);
    const bookedDurationMinutes = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 60000
    );
    const bookedHours = bookedDurationMinutes / 60;
    console.log("📅 Booked hours:", bookedHours);

    // Nếu chưa checkout (chưa có check_out_at) → tính theo số giờ đã đặt
    // Nếu đã checkout (có check_out_at) → kiểm tra xem có lố quá không
    let billableHours = bookedHours;

    if (reservation.check_out_at) {
      // Đã checkout, kiểm tra xem có lố quá số giờ đã đặt không
      const checkIn = new Date(
        reservation.check_in_at || reservation.start_time
      );
      const checkOut = new Date(reservation.check_out_at);
      const actualDurationMinutes = Math.floor(
        (checkOut.getTime() - checkIn.getTime()) / 60000
      );
      const actualHours = actualDurationMinutes / 60;
      console.log("⏱️ Actual parking hours:", actualHours);

      // Nếu thời gian thực tế > thời gian đã đặt → tính thêm 1 giờ
      if (actualHours > bookedHours) {
        billableHours = bookedHours + 1;
        console.log(
          "➕ Exceeded booked time, adding 1 hour. Total:",
          billableHours
        );
      } else {
        console.log(
          "✅ Within booked time, using booked hours:",
          billableHours
        );
      }
    } else {
      // Chưa checkout → tính theo số giờ đã đặt
      console.log("✅ Not checked out yet, using booked hours:", billableHours);
    }

    // Giá cơ bản: số giờ tính × hourly
    let totalAmount = pricing.hourly * billableHours;
    console.log("💰 Base amount:", totalAmount, "for", billableHours, "hours");

    // Áp dụng peak multiplier nếu có
    if (pricing.peak_enabled && pricing.peak_multiplier) {
      totalAmount = totalAmount * pricing.peak_multiplier;
      console.log("📈 Applied peak multiplier:", pricing.peak_multiplier);
    }

    // Áp dụng daily cap
    if (pricing.daily_cap && totalAmount > pricing.daily_cap) {
      totalAmount = pricing.daily_cap;
      console.log("🔝 Applied daily cap:", pricing.daily_cap);
    }

    return Math.ceil(totalAmount);
  };

  const handlePayment = async () => {
    if (!reservation || amount === 0 || !reservationId) {
      Alert.alert("Lỗi", "Số tiền thanh toán không hợp lệ");
      return;
    }

    try {
      setProcessing(true);

      // ✅ 1. Tạo payment link từ VNPAY với reservation_id
      const response = await apiPayment.post("/payments/create", {
        order_id: reservation.reservation_code,
        reservation_id: parseInt(reservationId), // ✅ Gửi reservation_id
        amount: amount,
        bank_code: null,
      });

      const { payUrl } = response.data;

      console.log("🔗 Payment URL:", payUrl);

      // ✅ 2. Mở browser với payment URL
      const canOpen = await Linking.canOpenURL(payUrl);
      if (canOpen) {
        await Linking.openURL(payUrl);
        // Không cần Alert nữa vì sẽ tự động redirect về app
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

  // ✅ Xóa hàm pollAndCheckout vì không cần nữa (backend tự động check-out qua IPN)

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
          <Text className="text-2xl font-bold text-gray-800">THANH TOÁN</Text>
        </View>
        <Pressable
          onPress={() => router.push("/screens/tab/HomeScreen")}
          className="h-12 w-12 items-center justify-center bg-white rounded-full shadow-sm"
        >
          <Ionicons name="home" size={24} color="#374151" />
        </Pressable>
      </View>
      <View style={{ padding: 24 }}>
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
                Thanh toán trực tuyến
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
