import { type ParkingLotStats, type ParkingLot } from "@/lib/api/parking-lots";
import { AppColor } from "@/lib/utils/color";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Text, TouchableOpacity, View } from "react-native";

export default function DetailMarkerPanel({
  lot,
  statistics,
  onClose,
  onReserve,
}: {
  lot: ParkingLot;
  statistics: ParkingLotStats;
  onClose: () => void;
  onReserve: () => void;
}) {
  // xử lý dữ liệu an toàn (có thể undefined tùy schema)
  const { available } = statistics.summary;
  const { motorbike, car_4_seat, car_7_seat, light_truck } =
    statistics.by_vehicle_type;

  const name = lot?.name ?? "Bãi đỗ xe";

  return (
    <>
      {/* Card thông tin */}
      <View className="absolute left-0 right-0 bottom-24 px-4">
        <View
          className="bg-white rounded-2xl p-4 border border-gray-100"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          <View className="flex-row items-start justify-between">
            {/* Tên bãi */}
            <Text
              className="text-[17px] font-semibold mr-3"
              numberOfLines={2}
              style={{
                color: AppColor.PRIMARY,
                flexGrow: 1,
                flexShrink: 1,
                flexBasis: "65%",
              }}
            >
              {name}
            </Text>

            {/* Nhóm chip + close: KHÔNG cho co lại */}
            <View className="flex-row items-center" style={{ flexShrink: 0 }}>
              {/* Chip trạng thái: minWidth + 1 dòng */}
              <View
                className={available > 0 ? "bg-green-50" : "bg-red-50"}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  flexDirection: "row",
                  alignItems: "center",
                  minWidth: 92, // ✅ luôn đủ rộng, không wrap
                }}
              >
                <MaterialCommunityIcons
                  name="checkbox-blank-circle"
                  size={10}
                  color={available > 0 ? "#16a34a" : "#ef4444"}
                />
                <Text
                  numberOfLines={1} // ✅ ép 1 dòng
                  ellipsizeMode="clip"
                  style={{
                    marginLeft: 6,
                    fontSize: 12,
                    fontWeight: "600",
                    color: available > 0 ? "#16a34a" : "#ef4444",
                  }}
                >
                  {available > 0 ? "Còn chỗ" : "Hết chỗ"}
                </Text>
              </View>

              {/* Nút đóng */}
              <TouchableOpacity
                onPress={onClose}
                style={{ padding: 4, marginLeft: 8 }}
              >
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-gray-100 my-3" />

          {/* Body: loại chỗ */}
          <View className="gap-2">
            {/* Xe máy */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="two-wheeler" size={22} color="#6b7280" />
                <Text className="text-base" style={{ color: AppColor.TEXT }}>
                  Xe máy
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Capacity
                  available={motorbike.available}
                  total={motorbike.total}
                  color="#22c55e"
                />
                <Text style={{ color: AppColor.TEXT }}>
                  <Text className="text-green-600">{motorbike.available}</Text>
                  <Text> / {motorbike.total}</Text>
                </Text>
              </View>
            </View>

            {/* Ô tô 4 chỗ */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons
                  name="car-hatchback"
                  size={22}
                  color="#6b7280"
                />
                <Text className="text-base" style={{ color: AppColor.TEXT }}>
                  Ô tô 4 chỗ
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Capacity
                  available={car_4_seat.available}
                  total={car_4_seat.total}
                  color="#22c55e"
                />
                <Text style={{ color: AppColor.TEXT }}>
                  <Text className="text-green-600">{car_4_seat.available}</Text>
                  <Text> / {car_4_seat.total}</Text>
                </Text>
              </View>
            </View>

            {/* Ô tô 7 chỗ */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons
                  name="car-estate"
                  size={22}
                  color="#6b7280"
                />
                <Text className="text-base" style={{ color: AppColor.TEXT }}>
                  Ô tô 7 chỗ
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Capacity
                  available={car_7_seat.available}
                  total={car_7_seat.total}
                  color="#22c55e"
                />
                <Text style={{ color: AppColor.TEXT }}>
                  <Text className="text-green-600">{car_7_seat.available}</Text>
                  <Text> / {car_7_seat.total}</Text>
                </Text>
              </View>
            </View>

            {/* Xe tải nhẹ */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons
                  name="truck"
                  size={22}
                  color="#6b7280"
                />
                <Text className="text-base" style={{ color: AppColor.TEXT }}>
                  Xe tải nhẹ
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Capacity
                  available={light_truck.available}
                  total={light_truck.total}
                  color="#22c55e"
                />
                <Text style={{ color: AppColor.TEXT }}>
                  <Text className="text-green-600">
                    {light_truck.available}
                  </Text>
                  <Text> / {light_truck.total}</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Nút ĐẶT CHỖ (gradient nổi) */}
      <View className="absolute left-0 right-0 bottom-8 px-4">
        <TouchableOpacity
          onPress={onReserve}
          activeOpacity={0.9}
          className="rounded-xl overflow-hidden"
        >
          <LinearGradient
            colors={[AppColor.PRIMARY, AppColor.SECONDARY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-4 items-center"
          >
            <Text className="text-white font-bold tracking-wider">ĐẶT CHỖ</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );
}

function Capacity({
  available,
  total,
  color = "#22c55e",
}: {
  available: number;
  total: number;
  color?: string;
}) {
  const ratio = Math.max(0, Math.min(1, total ? available / total : 0));
  return (
    <View className="w-24 h-2 rounded-full bg-gray-200 overflow-hidden">
      <View
        style={{ width: `${ratio * 100}%`, backgroundColor: color }}
        className="h-full"
      />
    </View>
  );
}
