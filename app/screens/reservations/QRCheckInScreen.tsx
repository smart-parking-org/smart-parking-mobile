import { useEffect, useState, useCallback, useRef } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { apiPayment } from "../../../lib/api/client";
import {
  expireDue,
  extendReservation,
  cancelReservation,
  checkInReservation,
} from "../../../lib/api/booking";
import { AppColor } from "@/lib/utils/color";

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
  user_snapshot?: {
    name: string;
    phone: string;
  };
  vehicle_snapshot?: {
    license_plate: string;
    vehicle_type: string;
  };
  reservation_request: {
    parking_lot: {
      id: number;
      name: string;
    };
  };
  distance_from_gate_meters?: number;
};
export const getVehicleIcon = (type?: string) => {
  if (!type) return "car";
  return type === "motorbike" ? "bicycle" : "car";
};

export const getGateTypeLabel = (type?: string) => {
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
  const [actionLoading, setActionLoading] = useState(false);
  const [hasExtended, setHasExtended] = useState(false);
  const hasExpiredCalled = useRef(false);

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

      // QR code sử dụng reservation_code trực tiếp
      setQr(resData.reservation_code);

      // Tính TTL từ expires_at
      if (resData.expires_at) {
        const expires = new Date(resData.expires_at).getTime();
        const now = Date.now();
        const remaining = Math.floor((expires - now) / 1000);
        setTtl(Math.max(0, remaining));
        // Nếu đã hết hạn và status vẫn là confirmed, gọi expireDue
        if (
          remaining <= 0 &&
          resData.status === "confirmed" &&
          !hasExpiredCalled.current
        ) {
          hasExpiredCalled.current = true;
          expireDue()
            .then(() => {
              // Reload lại để cập nhật status
              setTimeout(() => load(), 500);
            })
            .catch((e) => {
              console.error("Error calling expireDue on load:", e);
              setTimeout(() => load(), 500);
            });
        } else if (remaining > 0 && resData.status === "confirmed") {
          // Reset expired flag nếu còn thời gian và status là confirmed
          hasExpiredCalled.current = false;
        }
      } else {
        setTtl(900); // Default 15 phút
        if (resData.status === "confirmed") {
          hasExpiredCalled.current = false;
        }
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

  // Đếm ngược timer và gọi expireDue khi hết hạn
  useEffect(() => {
    if (ttl <= 0) {
      return;
    }
    const t = setInterval(() => {
      setTtl((s) => {
        const newTtl = Math.max(0, s - 1);
        // Khi TTL về 0, trigger expire
        if (
          newTtl === 0 &&
          !hasExpiredCalled.current &&
          reservation &&
          reservation.status === "confirmed"
        ) {
          hasExpiredCalled.current = true;
          expireDue()
            .then(() => {
              load();
            })
            .catch((e) => {
              console.error("Error calling expireDue:", e);
              load();
            });
        }
        return newTtl;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [ttl, reservation, load]);

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

  const handleExtend = async () => {
    if (!reservation || !bookingId || hasExtended) return;

    Alert.alert("Gia hạn đặt chỗ", "Bạn có muốn gia hạn không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xác nhận",
        onPress: async () => {
          try {
            setActionLoading(true);
            await extendReservation(parseInt(bookingId), 15);
            setHasExtended(true); // Đánh dấu đã gia hạn
            Alert.alert("Thành công", "Đã gia hạn đặt chỗ");
            hasExpiredCalled.current = false; // Reset để có thể gọi lại expire nếu cần
            await load();
          } catch (e: any) {
            console.error("Error extending reservation:", e);
            const errorMessage =
              e.response?.data?.message ||
              "Không thể gia hạn đặt chỗ. Vui lòng thử lại.";
            Alert.alert("Lỗi", errorMessage);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleCancel = async () => {
    if (!reservation || !bookingId) return;

    Alert.alert("Hủy đặt chỗ", "Bạn có chắc chắn muốn hủy đặt chỗ này không?", [
      { text: "Không", style: "cancel" },
      {
        text: "Có, hủy",
        style: "destructive",
        onPress: async () => {
          try {
            setActionLoading(true);
            await cancelReservation(parseInt(bookingId));
            Alert.alert("Thành công", "Đã hủy đặt chỗ", [
              {
                text: "OK",
                onPress: () => {
                  router.back();
                },
              },
            ]);
          } catch (e: any) {
            console.error("Error cancelling reservation:", e);
            const errorMessage =
              e.response?.data?.message ||
              "Không thể hủy đặt chỗ. Vui lòng thử lại.";
            Alert.alert("Lỗi", errorMessage);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleCheckIn = async () => {
    if (!reservation || !bookingId) return;

    Alert.alert("Check-in", "Bạn có muốn check-in vào bãi đỗ không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xác nhận",
        onPress: async () => {
          try {
            setActionLoading(true);
            const response = await checkInReservation(parseInt(bookingId));

            // ✅ Kiểm tra nếu có monthly pass và checkout code
            if (response.data?.skip_payment && response.data?.checkout_code) {
              // Có vé tháng → chuyển thẳng sang trang checkout QR
              Alert.alert(
                "Check-in thành công",
                "Vé tháng của bạn đã được áp dụng. Vui lòng quét mã checkout khi ra khỏi bãi đỗ.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      router.replace({
                        pathname: "/screens/reservations/QRCheckoutScreen",
                        params: {
                          reservationId: String(bookingId),
                          checkoutCode:
                            response.data.checkout_code?.checkout_code,
                        },
                      });
                    },
                  },
                ]
              );
            } else {
              // Không có vé tháng → reload để cập nhật status
              Alert.alert("Thành công", "Check-in thành công");
              await load();
            }
          } catch (e: any) {
            console.error("Error checking in reservation:", e);
            const errorMessage =
              e.response?.data?.message ||
              "Không thể check-in. Vui lòng thử lại.";
            Alert.alert("Lỗi", errorMessage);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "CHI TIẾT ĐẶT CHỖ",
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
          className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
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
            <View className="px-6 mt-6">
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

                  {qr && ttl > 0 && reservation?.status === "confirmed" ? (
                    <View className="items-center">
                      <View className="bg-white p-4 rounded-2xl shadow-sm border-2 border-gray-100">
                        <QRCode value={qr} size={200} />
                      </View>
                      <Text className="mt-4 text-gray-600 text-center text-sm leading-5 px-4">
                        Đưa QR này cho nhân viên hoặc máy quét để check-in vào
                        bãi xe
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
                        <Ionicons
                          name="alert-circle"
                          size={32}
                          color="#ef4444"
                        />
                      </View>
                      <Text className="text-red-600 font-medium text-center">
                        {reservation?.status === "expired" ||
                        reservation?.status === "checked_in"
                          ? "QR Code đã hết hạn hoặc đang check-in"
                          : "QR Code không khả dụng"}
                      </Text>
                      <Text className="text-red-500 text-sm text-center mt-2">
                        {reservation?.status === "expired"
                          ? "Vui lòng làm mới hoặc đặt chỗ mới"
                          : reservation?.status === "checked_in"
                          ? "Trạng thái: " + "Đã check-in"
                          : "Trạng thái: " + reservation?.status}
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

                    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                      <View className="flex-row items-center">
                        <Ionicons name="business" size={20} color="#6b7280" />
                        <Text className="text-gray-600 font-medium ml-3">
                          Bãi đỗ
                        </Text>
                      </View>
                      <Text className="text-gray-800 font-semibold text-base">
                        {reservation.reservation_request.parking_lot.name ||
                          "N/A"}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                      <View className="flex-row items-center">
                        <Ionicons
                          name="trail-sign-outline"
                          size={20}
                          color="#6b7280"
                        />
                        <Text className="text-gray-600 font-medium ml-3">
                          Cổng
                        </Text>
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
                        {new Date(reservation.start_time).toLocaleString(
                          "vi-VN"
                        )}
                      </Text>
                    </View>

                    {reservation.end_time && (
                      <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                        <View className="flex-row items-center">
                          <Ionicons
                            name="time-outline"
                            size={20}
                            color="#6b7280"
                          />
                          <Text className="text-gray-600 font-medium ml-3">
                            Kết thúc
                          </Text>
                        </View>
                        <Text className="text-gray-800 font-semibold text-base">
                          {new Date(reservation.end_time).toLocaleString(
                            "vi-VN"
                          )}
                        </Text>
                      </View>
                    )}

                    {reservation.start_time && reservation.end_time && (
                      <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                        <View className="flex-row items-center">
                          <Ionicons
                            name="hourglass"
                            size={20}
                            color="#6b7280"
                          />
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
              )}

              {/* Action Buttons */}
              {reservation && reservation.status === "confirmed" && (
                <View className="mb-8">
                  {/* Check-in button */}
                  {/* <Pressable
                  onPress={handleCheckIn}
                  disabled={actionLoading}
                  style={({ pressed }) => [
                    {
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                      opacity: actionLoading ? 0.7 : 1,
                      borderRadius: 16,
                      overflow: "hidden",
                      marginBottom: 12,
                    },
                  ]}
                >
                  {actionLoading ? (
                    <View
                      className="py-4 px-6"
                      style={{ backgroundColor: "#e5e7eb" }}
                    >
                      <ActivityIndicator size="small" color="#6b7280" />
                    </View>
                  ) : (
                    <LinearGradient
                      colors={["#3b82f6", "#2563eb"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        paddingVertical: 16,
                        paddingHorizontal: 24,
                        borderRadius: 16,
                      }}
                    >
                      <View className="flex-row items-center">
                        <View
                          className="rounded-full p-2"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.3)",
                          }}
                        >
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={22}
                            color="white"
                          />
                        </View>
                        <View className="flex-1 ml-4">
                          <Text
                            className="font-bold text-base"
                            style={{ color: "#ffffff" }}
                          >
                            Check-in vào bãi đỗ
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="white"
                          style={{ opacity: 0.9 }}
                        />
                      </View>
                    </LinearGradient>
                  )}
                </Pressable> */}

                  {/* Gia hạn button */}
                  <Pressable
                    onPress={handleExtend}
                    disabled={actionLoading || ttl <= 0 || hasExtended}
                    style={({ pressed }) => [
                      {
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                        opacity:
                          actionLoading || ttl <= 0 || hasExtended ? 0.7 : 1,
                        borderRadius: 16,
                        overflow: "hidden",
                      },
                    ]}
                  >
                    {actionLoading || ttl <= 0 || hasExtended ? (
                      <View
                        className="py-4 px-6"
                        style={{ backgroundColor: "#e5e7eb" }}
                      >
                        <View className="flex-row items-center">
                          {actionLoading ? (
                            <ActivityIndicator size="small" color="#6b7280" />
                          ) : (
                            <>
                              <View
                                className="rounded-full p-2"
                                style={{
                                  backgroundColor: "rgba(0, 0, 0, 0.1)",
                                }}
                              >
                                <Ionicons
                                  name={
                                    hasExtended
                                      ? "checkmark-circle"
                                      : "time-outline"
                                  }
                                  size={22}
                                  color="#6b7280"
                                />
                              </View>
                              <View className="flex-1 ml-4">
                                <Text
                                  className="font-bold text-base"
                                  style={{ color: "#374151" }}
                                >
                                  {hasExtended ? "Đã gia hạn" : "Gia hạn"}
                                </Text>
                                {hasExtended && (
                                  <Text
                                    className="text-xs mt-0.5"
                                    style={{ color: "#6b7280" }}
                                  >
                                    Chỉ được gia hạn 1 lần
                                  </Text>
                                )}
                              </View>
                            </>
                          )}
                        </View>
                      </View>
                    ) : (
                      <LinearGradient
                        colors={["#10b981", "#059669"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          paddingVertical: 16,
                          paddingHorizontal: 24,
                          borderRadius: 16,
                        }}
                      >
                        <View className="flex-row items-center">
                          <View
                            className="rounded-full p-2"
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.3)",
                            }}
                          >
                            <Ionicons
                              name="time-outline"
                              size={22}
                              color="white"
                            />
                          </View>
                          <View className="flex-1 ml-4">
                            <Text
                              className="font-bold text-base"
                              style={{ color: "#ffffff" }}
                            >
                              Gia hạn
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color="white"
                            style={{ opacity: 0.9 }}
                          />
                        </View>
                      </LinearGradient>
                    )}
                  </Pressable>

                  {/* Hủy button */}
                  <Pressable
                    className="mt-4"
                    onPress={handleCancel}
                    disabled={actionLoading}
                    style={({ pressed }) => [
                      {
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                        opacity: actionLoading ? 0.7 : 1,
                        borderRadius: 16,
                        overflow: "hidden",
                      },
                    ]}
                  >
                    {actionLoading ? (
                      <View
                        className="py-4 px-6"
                        style={{ backgroundColor: "#e5e7eb" }}
                      >
                        <ActivityIndicator size="small" color="#6b7280" />
                      </View>
                    ) : (
                      <LinearGradient
                        colors={["#ef4444", "#dc2626"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          paddingVertical: 16,
                          paddingHorizontal: 24,
                          borderRadius: 16,
                        }}
                      >
                        <View className="flex-row items-center">
                          <View
                            className="rounded-full p-2"
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.3)",
                            }}
                          >
                            <Ionicons
                              name="close-circle-outline"
                              size={22}
                              color="white"
                            />
                          </View>
                          <View className="flex-1 ml-4">
                            <Text
                              className="font-bold text-base"
                              style={{ color: "#ffffff" }}
                            >
                              Hủy đặt chỗ
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color="white"
                            style={{ opacity: 0.9 }}
                          />
                        </View>
                      </LinearGradient>
                    )}
                  </Pressable>
                </View>
              )}

              {/* Reload button khi expired */}
              {reservation && reservation.status === "expired" && (
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
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}
