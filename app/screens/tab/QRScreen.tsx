import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import {
  getMyActiveReservations,
  checkOutReservation,
} from "../../../lib/api/booking";
import { getProfile } from "../../../lib/api/auth";
import type { Reservation } from "../../../lib/api/booking";
import { clearActiveCheckins } from "@/lib/storage/checkins";

const qrPayload = (item: Reservation) => {
  // Đơn giản: chỉ dùng reservation_code
  return item.reservation_code;
};

export default function QRScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Reservation[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Get user_id từ profile
      const user = await getProfile();
      const userId = user.id;

      // Load reservations của user từ database
      const reservations = await getMyActiveReservations(userId);
      setItems(reservations);

      console.log(
        `✅ Loaded ${reservations.length} reservations for user ${userId}`
      );
    } catch (error: any) {
      console.error("Error loading reservations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    load();
  }, [load]);

  const onCheckout = (reservation: Reservation) => {
    // Navigate tới PaymentScreen thay vì gọi API trực tiếp
    router.push({
      pathname: "/screens/reservations/PaymentScreen",
      params: {
        reservationId: String(reservation.id),
      },
    });
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

  const renderItem = ({ item }: { item: Reservation }) => (
    <View className="bg-white rounded-3xl shadow-lg p-6 mb-6 mx-2">
      {/* Header */}
      <View className="flex-row items-center mb-6">
        <View className="bg-blue-100 p-3 rounded-full mr-4">
          <Ionicons name="qr-code" size={24} color="#3b82f6" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800">
            {item.reservation_code}
          </Text>
          <Text className="text-sm text-gray-500">
            {item.slot?.slot_code || "N/A"} •{" "}
            {getVehicleTypeLabel(item.vehicle_snapshot?.vehicle_type)}
          </Text>
        </View>
        {/* Status badge */}
        <View
          className={`px-3 py-1 rounded-full ${
            item.status === "checked_in" ? "bg-blue-100" : "bg-green-100"
          }`}
        >
          <Text
            className={`font-semibold text-sm ${
              item.status === "checked_in" ? "text-blue-800" : "text-green-800"
            }`}
          >
            {item.status === "checked_in" ? "Đã check-in" : "Đã xác nhận"}
          </Text>
        </View>
      </View>

      {/* QR Code - Dùng reservation_code trực tiếp */}
      <View className="items-center mb-6">
        <View className="bg-white p-4 rounded-2xl shadow-sm border-2 border-gray-100">
          <QRCode value={qrPayload(item)} size={160} />
        </View>
        <Text className="mt-3 text-gray-600 text-center text-sm">
          Quét mã này để check-in
        </Text>
      </View>

      {/* Details */}
      <View className="space-y-3 mb-6">
        <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
          <View className="flex-row items-center">
            <Ionicons name="location" size={18} color="#6b7280" />
            <Text className="text-gray-600 font-medium ml-2">Vị trí</Text>
          </View>
          <Text className="text-gray-800 font-semibold">
            {item.slot?.slot_code || "N/A"}
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
          <View className="flex-row items-center">
            <Ionicons
              name={
                item.vehicle_snapshot?.vehicle_type === "motorbike"
                  ? "bicycle"
                  : "car"
              }
              size={18}
              color="#6b7280"
            />
            <Text className="text-gray-600 font-medium ml-2">Loại xe</Text>
          </View>
          <Text className="text-gray-800 font-semibold">
            {getVehicleTypeLabel(item.vehicle_snapshot?.vehicle_type)}
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
          <View className="flex-row items-center">
            <Ionicons name="card" size={18} color="#6b7280" />
            <Text className="text-gray-600 font-medium ml-2">Biển số</Text>
          </View>
          <Text className="text-gray-800 font-semibold">
            {item.vehicle_snapshot?.license_plate || "N/A"}
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-2">
          <View className="flex-row items-center">
            <Ionicons name="time" size={18} color="#6b7280" />
            <Text className="text-gray-600 font-medium ml-2">Thời gian</Text>
          </View>
          <Text className="text-gray-800 font-semibold">
            {new Date(item.start_time).toLocaleString("vi-VN")}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        {/* Nút Xem chi tiết */}
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/screens/reservations/QRCheckInScreen",
              params: {
                bookingId: String(item.id),
                reservationCode: item.reservation_code,
              },
            })
          }
          className={
            item.status === "checked_in"
              ? "flex-1 h-12 rounded-2xl items-center justify-center bg-blue-600"
              : "h-12 rounded-2xl items-center justify-center bg-blue-600 w-full"
          }
          style={({ pressed }) => [
            {
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="eye" size={20} color="white" />
            <Text className="text-white font-bold ml-2">Xem chi tiết</Text>
          </View>
        </Pressable>

        {/* Nút Thanh toán */}
        {item.status === "checked_in" && (
          <Pressable
            onPress={() => onCheckout(item)}
            className="flex-1 h-12 rounded-2xl items-center justify-center bg-green-400"
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="card" size={20} color="white" />
              <Text className="text-white font-bold ml-2">Thanh toán</Text>
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center">
        <View className="bg-white p-8 rounded-3xl shadow-lg items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-700 font-medium text-center">
            Đang tải các QR đang hoạt động...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <View className="pt-12 pb-6 px-6">
        <View className="flex-row items-center">
          <View className="bg-blue-100 p-3 rounded-full mr-4">
            <Ionicons name="qr-code" size={24} color="#3b82f6" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800">
              QR Check-in
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              Quản lý các mã QR đang hoạt động
            </Text>
          </View>
        </View>
      </View>

      {items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-white p-8 rounded-3xl shadow-lg items-center">
            <View className="bg-gray-100 p-6 rounded-full mb-4">
              <Ionicons name="qr-code-outline" size={48} color="#9ca3af" />
            </View>
            <Text className="text-gray-600 font-medium text-lg mb-2">
              Chưa có mã QR nào
            </Text>
            <Text className="text-gray-500 text-center text-sm leading-5">
              Bạn chưa có mã QR check-in nào đang hoạt động.{"\n"}
              Hãy đặt chỗ để tạo mã QR mới.
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
