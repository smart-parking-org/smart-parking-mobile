import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useVehicleStore } from "@/lib/storage/vehicle";
import {
  getParkingLots,
  getParkingLotStatistics,
  type ParkingLot,
} from "@/lib/api/parking-lots";

// Extended type với thống kê slots
type LotWithStats = ParkingLot & {
  slots: number;
  available: number;
  occupied: number;
};

function ParkingCard({
  lot,
  onPress,
}: {
  lot: LotWithStats;
  onPress?: () => void;
}) {
  const isFull = lot.available === 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`rounded-2xl px-4 py-3 mb-3 border
        ${isFull ? "bg-rose-50" : "bg-white"} border-gray-200
        shadow-sm`}
      style={{ elevation: 1 }}
    >
      <View className="flex-row items-center">
        {/* info left */}
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-gray-800">
            {lot.name}
          </Text>
          <View className="mt-1">
            <Text className="text-[12px] text-gray-600">
              Parking Slots :{" "}
              <Text className="font-medium text-gray-800">{lot.slots}</Text>
            </Text>
            <Text className="text-[12px] text-gray-600">
              Available Slots :{" "}
              <Text
                className={`font-medium ${
                  isFull ? "text-rose-500" : "text-emerald-600"
                }`}
              >
                {lot.available}
              </Text>
            </Text>
            {lot.occupied > 0 && (
              <Text className="text-[12px] text-gray-600">
                Occupied :{" "}
                <Text className="font-medium text-gray-800">
                  {lot.occupied}
                </Text>
              </Text>
            )}
          </View>
        </View>

        {/* divider + icons right */}
        <View className="ml-3 items-center">
          <Ionicons
            name="car-sport"
            size={28}
            color={isFull ? "#ef4444" : "#f59e0b"}
          />
        </View>

        <View className="mx-2 h-10 w-[1px] bg-gray-300/60" />

        <View className="items-center justify-center w-10 h-12 rounded-xl bg-indigo-50">
          <Text className="text-[22px] font-bold text-indigo-500">P</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ParkingLotsScreen() {
  const [query, setQuery] = useState<"all" | "available" | "full">("all");
  const [lots, setLots] = useState<LotWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { defaultType, hydrate } = useVehicleStore();

  useEffect(() => {
    hydrate();
    loadParkingLots();
  }, []);

  const loadParkingLots = async () => {
    try {
      setLoading(true);

      console.log("🔄 Loading parking lots...");

      // Lấy danh sách parking lots
      const lotsData = await getParkingLots();

      console.log(`✅ Got ${lotsData.length} parking lots`);

      // Với mỗi lot, lấy thống kê
      const lotsWithStats = await Promise.all(
        lotsData.map(async (lot) => {
          try {
            const stats = await getParkingLotStatistics(lot.id);
            return {
              ...lot,
              slots: stats.summary.total,
              available: stats.summary.available,
              occupied: stats.summary.occupied,
            };
          } catch (err: any) {
            console.warn(
              `⚠️ Could not get stats for lot ${lot.id}:`,
              err.message
            );
            // Nếu không lấy được stats, dùng giá trị mặc định
            return {
              ...lot,
              slots: 0,
              available: 0,
              occupied: 0,
            };
          }
        })
      );

      setLots(lotsWithStats);
    } catch (error: any) {
      console.error("❌ Error loading parking lots:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });

      Alert.alert(
        "Lỗi kết nối",
        `Không thể tải danh sách bãi đỗ xe.\n\nChi tiết: ${
          error.message || "Lỗi không xác định"
        }\n\nVui lòng kiểm tra:\n1. API URL đã đúng chưa?\n2. Backend service đang chạy?`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadParkingLots();
  };

  const data = useMemo(() => {
    if (query === "available") return lots.filter((l) => l.available > 0);
    if (query === "full") return lots.filter((l) => l.available === 0);
    return lots;
  }, [query, lots]);

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Đang tải danh sách bãi đỗ...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-14 pb-3 px-4 flex-row items-center justify-between border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 rounded-full items-center justify-center"
        >
          <Ionicons name="chevron-back" size={22} color="#6b7280" />
        </TouchableOpacity>
        <Text className="text-[16px] font-semibold text-black">
          CHỌN VỊ TRÍ BÃI ĐỖ
        </Text>
        {/* filter/sort */}
        <TouchableOpacity
          onPress={() =>
            setQuery((q) =>
              q === "all" ? "available" : q === "available" ? "full" : "all"
            )
          }
          className="h-10 w-10 items-center justify-center"
        >
          <Ionicons name="swap-vertical" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <ParkingCard
            lot={item}
            onPress={() => {
              // Navigate tới VehicleSlotScreen (form đặt chỗ)
              router.push({
                pathname: "/screens/parking/VehicleSlotScreen",
                params: {
                  lotId: String(item.id),
                  lotName: item.name,
                },
              });
            }}
          />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Ionicons name="alert-circle-outline" size={48} color="#9ca3af" />
            <Text className="text-gray-500 text-center mt-4">
              {query === "available"
                ? "Không có bãi đỗ nào còn chỗ"
                : "Không có bãi đỗ xe"}
            </Text>
          </View>
        }
        ListFooterComponent={<View className="h-2" />}
      />

      {/* Gợi ý trạng thái filter */}
      <View className="absolute bottom-3 self-center bg-white/90 px-3 py-1 rounded-full border border-gray-200">
        <Text className="text-gray-600 text-xs">
          {query === "all"
            ? "Hiển thị: tất cả"
            : query === "available"
            ? "Hiển thị: còn chỗ"
            : "Hiển thị: hết chỗ"}
        </Text>
      </View>
    </View>
  );
}
