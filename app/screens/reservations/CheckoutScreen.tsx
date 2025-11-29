import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  AppState,
  RefreshControl,
} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiPayment } from "@/lib/api/client";
import { checkOutReservation } from "@/lib/api/booking";
import * as ExpoLinking from "expo-linking";
import { AppColor } from "@/lib/utils/color";

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
    meta?: {
      payment_method?: string;
      monthly_pass_id?: number;
      is_free?: boolean;
    };
  };
  monthly_pass?: {
    id: number;
    order_id: string;
    end_date?: string;
  } | null;
  is_free?: boolean;
};

export default function CheckoutScreen() {
  const { reservationId } = useLocalSearchParams<{
    reservationId: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reservation, setReservation] = useState<ReservationDetails | null>(
    null
  );
  const [amount, setAmount] = useState(0);
  const [isPendingPayment, setIsPendingPayment] = useState(false);
  const [hasOpenedPayment, setHasOpenedPayment] = useState(false);

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
      const checkIn = new Date(
        reservation.check_in_at || reservation.start_time
      );
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

  const loadReservationDetails = useCallback(
    async (showLoading = true) => {
      if (!reservationId) return;

      try {
        if (showLoading) {
          setLoading(true);
        }
        const { data } = await apiPayment.get<{ data: ReservationDetails }>(
          `/reservations/${reservationId}`
        );
        setReservation(data.data);

        // Kiểm tra trạng thái
        const isPending = data.data.status === "pending_payment";
        setIsPendingPayment(isPending);

        // ✅ Ưu tiên: Lấy amount từ payment (backend đã tính)
        if (data.data.payment && data.data.payment.amount) {
          setAmount(data.data.payment.amount);
        } else if (data.data.payment_id) {
          // Nếu có payment_id nhưng chưa load payment, load payment để lấy amount từ backend
          try {
            const paymentResponse = await apiPayment.get(
              `/payments/by-order/${data.data.reservation_code}`
            );
            if (paymentResponse.data?.amount) {
              setAmount(paymentResponse.data.amount);
            }
          } catch (paymentError) {
            console.error("Error loading payment:", paymentError);
          }
        } else if (data.data.status === "checked_in") {
          // ✅ Nếu chưa có payment và status là "checked_in", tự động gọi backend để tính amount
          // Gọi API tạo payment offline tạm thời để lấy amount (backend sẽ tính chính xác)
          try {
            const estimateResponse = await apiPayment.post("/payments/create", {
              order_id: data.data.reservation_code,
              reservation_id: parseInt(reservationId),
              payment_method: "offline", // Tạo payment offline để lấy amount
              bank_code: null,
            });

            if (estimateResponse.data?.amount) {
              setAmount(estimateResponse.data.amount);
              console.log(
                "💰 Amount được tính tự động từ backend:",
                estimateResponse.data.amount
              );
            }
          } catch (estimateError: any) {
            console.error("Error estimating amount:", estimateError);
            // Nếu lỗi, không hiển thị amount (sẽ tính lại khi chọn phương thức thanh toán)
          }
        }
        // ✅ Nếu chưa có payment và không phải "checked_in", amount = 0
      } catch (error: any) {
        console.error("Error loading reservation:", error);
        Alert.alert("Lỗi", "Không thể tải thông tin đặt chỗ");
        router.back();
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [reservationId]
  );

  // ✅ Hàm xử lý pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadReservationDetails(false); // Không hiển thị loading spinner khi refresh
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  }, [loadReservationDetails]);

  // ✅ Xử lý deep link từ VNPAY
  const handleDeepLink = useCallback(
    async ({ url }: { url: string }) => {
      try {
        const parsed = ExpoLinking.parse(url);

        if (
          parsed.path === "payment/result" ||
          url.includes("payment/result")
        ) {
          const params = parsed.queryParams;
          const status = params?.status as string;
          const reservationIdFromLink = params?.reservation_id as string;

          // Reset flag khi có deep link
          setHasOpenedPayment(false);

          if (status === "PAID" && reservationIdFromLink) {
            // Navigate tới QRCheckoutScreen để hiển thị QR code
            router.replace({
              pathname: "/screens/reservations/QRCheckoutScreen",
              params: {
                reservationId: reservationIdFromLink,
              },
            });
          } else if (status === "FAILED") {
            // Thanh toán thất bại - reload reservation để reset trạng thái
            Alert.alert(
              "Thanh toán thất bại",
              "Vui lòng thử lại hoặc chọn phương thức thanh toán khác.",
              [
                {
                  text: "OK",
                  onPress: () => {
                    // Reload reservation để reset về trạng thái ban đầu
                    loadReservationDetails();
                  },
                },
              ]
            );
          }
        }
      } catch (error) {
        console.error("Error handling deep link:", error);
      }
    },
    [loadReservationDetails]
  );

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
          // Khi app active, kiểm tra nếu đã mở payment và quay lại
          // Nếu không có deep link (thanh toán thất bại hoặc thoát), reload reservation
          if (hasOpenedPayment) {
            // Đợi một chút để deep link handler chạy trước
            setTimeout(() => {
              // Nếu vẫn còn ở màn hình này (chưa navigate), reload để reset
              loadReservationDetails();
              setHasOpenedPayment(false);
            }, 1000);
          }
        }
      }
    );

    return () => {
      subscription.remove();
      subscriptionAppState.remove();
    };
  }, [handleDeepLink, hasOpenedPayment, loadReservationDetails]);

  const handlePayment = async () => {
    if (!reservation || !reservationId) {
      Alert.alert("Lỗi", "Thông tin đặt chỗ không hợp lệ");
      return;
    }

    try {
      setProcessing(true);

      // ✅ Tạo payment link từ VNPAY với reservation_id và payment_method = 'online'
      // Backend sẽ tự tính amount dựa trên reservation (không cần gửi amount)
      const response = await apiPayment.post("/payments/create", {
        order_id: reservation.reservation_code,
        reservation_id: parseInt(reservationId),
        payment_method: "online", // Truyền method là 'online' (theo PaymentController)
        bank_code: null,
      });

      const { payUrl, amount: paymentAmount } = response.data;

      // Cập nhật amount từ response
      if (paymentAmount) {
        setAmount(paymentAmount);
        console.log("💰 Payment Amount từ backend:", paymentAmount);
      }

      console.log("🔗 Payment URL:", payUrl);

      if (!payUrl) {
        Alert.alert("Lỗi", "Không nhận được link thanh toán từ server");
        setProcessing(false);
        return;
      }

      // ✅ Đánh dấu đã mở payment để có thể reset nếu thất bại
      setHasOpenedPayment(true);

      // ✅ Mở browser với payment URL
      const canOpen = await Linking.canOpenURL(payUrl);
      if (canOpen) {
        await Linking.openURL(payUrl);
      } else {
        Alert.alert("Lỗi", "Không thể mở trình duyệt thanh toán");
        setHasOpenedPayment(false);
      }
    } catch (error: any) {
      console.error("Error creating payment:", error);
      const errorMessage =
        error.response?.data?.message || "Không thể tạo đơn thanh toán";
      Alert.alert("Lỗi", errorMessage);
      setHasOpenedPayment(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckout = async (paymentMethod: "online" | "offline") => {
    if (!reservation || !reservationId) {
      Alert.alert("Lỗi", "Thông tin đặt chỗ không hợp lệ");
      return;
    }

    try {
      setProcessing(true);

      // Nếu đã pending_payment
      if (isPendingPayment) {
        if (paymentMethod === "offline") {
          // ✅ Đã pending_payment nhưng chọn offline
          // Không thể gọi checkOutReservation vì reservation đã pending_payment
          // Thay vào đó, tạo payment mới với method offline
          try {
            const paymentResponse = await apiPayment.post("/payments/create", {
              order_id: reservation.reservation_code,
              reservation_id: parseInt(reservationId),
              payment_method: "offline", // ✅ Tạo payment offline mới
              bank_code: null,
            });

            const { amount: paymentAmount } = paymentResponse.data;

            // ✅ Cập nhật amount từ response (backend đã tính chính xác)
            if (paymentAmount) {
              setAmount(paymentAmount);
              console.log(
                "💰 Payment Amount từ backend (offline):",
                paymentAmount
              );
            }

            // ✅ Reload reservation để cập nhật trạng thái mới nhất
            await loadReservationDetails();

            // ✅ Thông báo và navigate tới QRCheckoutScreen
            // Payment offline sẽ được nhân viên xác nhận sau
            Alert.alert(
              "Chuyển sang thanh toán trực tiếp",
              "Đã tạo payment offline. Vui lòng thanh toán trực tiếp tại bãi xe. Nhân viên sẽ xác nhận thanh toán cho bạn.",
              [
                {
                  text: "OK",
                  onPress: () => {
                    router.replace({
                      pathname: "/screens/reservations/QRCheckoutScreen",
                      params: {
                        reservationId: reservationId,
                      },
                    });
                  },
                },
              ]
            );
          } catch (error: any) {
            console.error("Error creating offline payment:", error);
            Alert.alert(
              "Lỗi",
              error.response?.data?.message ||
                "Không thể tạo payment offline. Vui lòng thử lại."
            );
          }
        } else {
          // Đã pending_payment, chọn online → chỉ tạo payment link (không checkout nữa)
          await handlePayment();
        }
        return;
      }

      // Nếu chưa checkout (checked_in), gọi checkout API
      if (paymentMethod === "online") {
        // ✅ Thanh toán online: checkout với method 'online' trước
        const response = await checkOutReservation(
          parseInt(reservationId),
          "online"
        );

        // ✅ Kiểm tra monthly pass từ response checkout
        const monthlyPass = response.data?.data?.monthly_pass;
        const isFree = response.data?.data?.is_free;

        if (monthlyPass && isFree) {
          // Có monthly pass → đã checkout thành công, không cần thanh toán
          const checkoutCode = response.data?.data?.checkout_code || null;
          router.replace({
            pathname: "/screens/reservations/QRCheckoutScreen",
            params: {
              reservationId: reservationId,
              ...(checkoutCode && { checkoutCode: checkoutCode }),
            },
          });
          return;
        }

        // ✅ Sau khi checkout thành công, tạo payment link với method 'online'
        await handlePayment();
      } else {
        // ✅ Thanh toán offline: Tạo payment offline trước (KHÔNG gọi checkOutReservation)
        // Backend sẽ tự động cập nhật status thành pending_payment khi tạo payment offline
        try {
          const paymentResponse = await apiPayment.post("/payments/create", {
            order_id: reservation.reservation_code,
            reservation_id: parseInt(reservationId),
            payment_method: "offline", // ✅ Tạo payment offline
            bank_code: null,
          });

          const { amount: paymentAmount } = paymentResponse.data;

          // ✅ Cập nhật amount từ response (backend đã tính chính xác)
          if (paymentAmount) {
            setAmount(paymentAmount);
            console.log(
              "💰 Payment Amount từ backend (offline):",
              paymentAmount
            );
          }

          // ✅ Sau khi tạo payment offline, gọi checkout để cập nhật status thành pending_payment
          // Backend đã được sửa để set status thành pending_payment khi payment_method === 'offline'
          try {
            console.log("🔄 Đang gọi checkOutReservation với offline...");
            console.log("🔄 Reservation ID:", reservationId);
            console.log("🔄 Current status:", reservation?.status);

            const checkoutResponse = await checkOutReservation(
              parseInt(reservationId),
              "offline"
            );

            console.log(
              "📦 Full checkout response:",
              JSON.stringify(checkoutResponse, null, 2)
            );

            // ✅ Kiểm tra monthly pass từ response checkout
            const monthlyPass = checkoutResponse.data?.data?.monthly_pass;
            const isFree = checkoutResponse.data?.data?.is_free;

            if (monthlyPass && isFree) {
              // Có monthly pass → đã checkout thành công, không cần thanh toán
              const checkoutCode =
                checkoutResponse.data?.data?.checkout_code || null;
              router.replace({
                pathname: "/screens/reservations/QRCheckoutScreen",
                params: {
                  reservationId: reservationId,
                  ...(checkoutCode && { checkoutCode: checkoutCode }),
                },
              });
              return;
            }

            // ✅ Log status từ nhiều nguồn để debug
            const statusFromReservation =
              checkoutResponse.data?.data?.reservation?.status;
            const statusFromData = checkoutResponse.data?.data?.status;
            console.log("📊 Status từ reservation:", statusFromReservation);
            console.log("📊 Status từ data:", statusFromData);
            console.log("📊 Full data object:", checkoutResponse.data?.data);

            // ✅ Verify status đã được cập nhật
            if (
              statusFromReservation === "pending_payment" ||
              statusFromData === "pending_payment"
            ) {
              console.log("✅ Status đã được cập nhật thành pending_payment");
            } else {
              console.warn(
                "⚠️ Status chưa được cập nhật đúng. Expected: pending_payment, Got:",
                statusFromReservation || statusFromData
              );
            }
          } catch (checkoutError: any) {
            console.error("❌ Error during checkout:", checkoutError);
            console.error("❌ Error message:", checkoutError.message);
            console.error("❌ Error response:", checkoutError.response?.data);
            console.error("❌ Error status:", checkoutError.response?.status);

            // ✅ Nếu lỗi là do status không đúng, thử reload và kiểm tra lại
            if (checkoutError.response?.status === 422) {
              console.log(
                "⚠️ Checkout failed với 422, có thể do status không đúng. Reloading..."
              );
            }
            // Nếu checkout lỗi, vẫn tiếp tục với payment đã tạo
          }

          // ✅ Reload reservation để cập nhật trạng thái mới nhất
          await loadReservationDetails();

          // ✅ Log status sau khi reload để verify
          console.log("📊 Status sau khi reload:", reservation?.status);

          // ✅ Thông báo và navigate tới QRCheckoutScreen
          Alert.alert(
            "Chuyển sang thanh toán trực tiếp",
            "Đã tạo payment offline. Vui lòng thanh toán trực tiếp tại bãi xe. Nhân viên sẽ xác nhận thanh toán cho bạn.",
            [
              {
                text: "OK",
                onPress: () => {
                  router.replace({
                    pathname: "/screens/reservations/QRCheckoutScreen",
                    params: {
                      reservationId: reservationId,
                    },
                  });
                },
              },
            ]
          );
        } catch (error: any) {
          console.error("Error creating offline payment:", error);
          Alert.alert(
            "Lỗi",
            error.response?.data?.message ||
              "Không thể tạo payment offline. Vui lòng thử lại."
          );
        }
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
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "THANH TOÁN",
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
        style={{ flex: 1, backgroundColor: "#f9fafb" }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
              }}
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
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}
            >
              Chi tiết đơn hàng
            </Text>

            <View style={{ gap: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: "#6b7280" }}>Vị trí</Text>
                <Text style={{ fontWeight: "600" }}>
                  {reservation.slot?.slot_code || "N/A"}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: "#6b7280" }}>Biển số</Text>
                <Text style={{ fontWeight: "600" }}>
                  {reservation.vehicle_snapshot?.license_plate || "N/A"}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
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
                    {reservation.pricing_snapshot.hourly.toLocaleString(
                      "vi-VN"
                    )}{" "}
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
              {amount > 0 ? (
                <Text
                  style={{ color: "white", fontSize: 32, fontWeight: "bold" }}
                >
                  {amount.toLocaleString("vi-VN")} đ
                </Text>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <ActivityIndicator size="small" color="white" />
                  <Text
                    style={{
                      color: "white",
                      fontSize: 18,
                      fontWeight: "600",
                      marginLeft: 8,
                    }}
                  >
                    Đang tính...
                  </Text>
                </View>
              )}
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
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}
            >
              Chọn phương thức thanh toán
            </Text>

            {/* Thông báo khi chưa có amount */}
            {amount === 0 &&
              !reservation.payment &&
              !reservation.payment_id && (
                <View
                  style={{
                    backgroundColor: "#e0e7ff",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color="#3b82f6"
                  />
                  <Text
                    style={{
                      color: "#1e40af",
                      fontSize: 14,
                      marginLeft: 8,
                      flex: 1,
                    }}
                  >
                    Số tiền sẽ được tính tự động khi bạn chọn phương thức thanh
                    toán
                  </Text>
                </View>
              )}

            {/* Thông báo nếu số tiền < 10.000 */}
            {amount > 0 && amount < 10000 && (
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

            {/* Offline Payment Button - chỉ ẩn khi đã checkout và status là pending_checkout */}
            {reservation?.status !== "pending_checkout" && (
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
            )}
          </View>

          {/* Info */}
          {amount >= 10000 && (
            <View style={{ marginTop: 8, alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="shield-checkmark" size={20} color="#6b7280" />
                <Text style={{ marginLeft: 8, color: "#6b7280", fontSize: 14 }}>
                  Thanh toán an toàn với VNPAY
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
