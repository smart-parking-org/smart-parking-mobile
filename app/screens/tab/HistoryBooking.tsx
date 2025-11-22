import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getProfile } from "../../../lib/api/auth";
import { apiPayment } from "../../../lib/api/client";
import { mapVehicleIcon } from "@/lib/mapVehiclleIcon";
import { VehicleType } from "@/lib/api/vehicles";
import { AppColor } from "@/lib/utils/color";

// ... existing types and constants ...

// Type cho Reservation từ API
type ReservationHistory = {
  id: number;
  reservation_code: string;
  status: string;
  start_time: string;
  end_time: string;
  expires_at: string;
  check_in_at: string | null;
  check_out_at: string | null;
  cancelled_at: string | null;
  extension_count: number;
  slot?: {
    id: number;
    slot_code: string;
    vehicle_type: string;
    parking_lot?: {
      id: number;
      name: string;
    };
  };
  vehicle_snapshot?: {
    id: number;
    license_plate: string;
    vehicle_type: VehicleType;
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
  payment?: {
    id: number;
    amount: number;
    status: string;
  } | null;
};

// Type cho Violation (nếu có API)
type Violation = {
  id: number;
  violation_type: string;
  description: string;
  fine_amount: number;
  created_at: string;
  reservation_code?: string;
  slot_code?: string;
  license_plate?: string;
};

// Tab types
type TabType = "bookings" | "violations";

// Status filter types
type StatusFilter =
  | "all"
  | "checked_out"
  | "checked_in"
  | "cancelled"
  | "expired"
  | "confirmed";

// Status filter options
const STATUS_FILTERS: { value: StatusFilter; label: string; icon: string }[] = [
  { value: "all", label: "Tất cả", icon: "apps" },
  { value: "checked_out", label: "Đã thanh toán", icon: "receipt" },
  { value: "checked_in", label: "Đang sử dụng", icon: "car" },
  { value: "cancelled", label: "Đã hủy", icon: "close-circle" },
  { value: "expired", label: "Hết hạn", icon: "time-outline" },
  { value: "confirmed", label: "Đã xác nhận", icon: "checkmark-circle" },
];

// API Functions
async function getAllReservations(
  userId: number,
  page: number = 1,
  perPage: number = 50,
  status?: string
): Promise<{ reservations: ReservationHistory[]; hasMore: boolean }> {
  try {
    const params: any = {
      page,
      per_page: perPage,
    };

    // Thêm status filter nếu không phải "all"
    if (status && status !== "all") {
      params.status = status;
    }

    const { data } = await apiPayment.get<{
      success: boolean;
      data: {
        reservations: ReservationHistory[];
        pagination: {
          current_page: number;
          per_page: number;
          total: number;
          last_page: number;
        };
        summary: any;
      };
    }>(`/reservations/user/${userId}/history`, {
      params,
    });

    return {
      reservations: data.data.reservations,
      hasMore:
        data.data.pagination.current_page < data.data.pagination.last_page,
    };
  } catch (error: any) {
    console.error("Error getting reservations history:", error);
    throw error;
  }
}

async function getViolations(userId: number): Promise<Violation[]> {
  try {
    // TODO: Thay thế endpoint này khi có API violations
    const { data } = await apiPayment.get<{
      success: boolean;
      data: Violation[];
    }>(`/violations`, {
      params: {
        user_id: userId,
      },
    });
    return data.data || [];
  } catch (error: any) {
    // Nếu API chưa có, trả về mảng rỗng
    console.warn("Violations API not available:", error.message);
    return [];
  }
}

// Helper functions
function getStatusLabel(status: string): {
  label: React.ReactElement;
  bgColor: string;
} {
  const statusMap: Record<
    string,
    { label: React.ReactElement; bgColor: string }
  > = {
    checked_out: {
      label: (
        <View className="flex-row items-center gap-1">
          <Ionicons name="card" size={16} color="#3b82f6" />
          <Text className="text-[10px] font-bold text-[#3b82f6]">
            Đã thanh toán
          </Text>
        </View>
      ),
      bgColor: "#dbeafe",
    },
    checked_in: {
      label: (
        <View className="flex-row items-center gap-1">
          <Ionicons name="radio" size={16} color="#22c55e" />
          <Text className="text-[10px] font-bold text-green-500">
            Đang sử dụng
          </Text>
        </View>
      ),
      bgColor: "#dcfce7",
    },
    cancelled: {
      label: (
        <View className="flex-row items-center gap-1">
          <Ionicons name="close" size={16} color="#ef4444" />
          <Text className="text-[10px] font-bold text-[#ef4444]">Đã hủy</Text>
        </View>
      ),
      bgColor: "#fee2e2",
    },
    expired: {
      label: (
        <View className="flex-row items-center gap-1">
          <Ionicons name="alarm" size={16} color="#f59e0b" />
          <Text className="text-[10px] font-bold text-[#f59e0b]">Hết hạn</Text>
        </View>
      ),
      bgColor: "#fef3c7",
    },
    confirmed: {
      label: (
        <View className="flex-row items-center gap-1">
          <Ionicons name="checkmark-circle" size={16} color="#06b6d4" />
          <Text className="text-[10px] font-bold text-[#06b6d4]">
            Đã xác nhận
          </Text>
        </View>
      ),
      bgColor: "#cffafe",
    },
  };
  return (
    statusMap[status] || {
      label: (
        <View>
          <Text>{status}</Text>
        </View>
      ),
      color: "#6b7280",
      bgColor: "#f3f4f6",
    }
  );
}

function getVehicleTypeLabel(type?: string) {
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
}

function getGateTypeLabel(type?: string) {
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
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Tab Selector Component
function TabSelector({
  selected,
  onSelect,
}: {
  selected: TabType;
  onSelect: (tab: TabType) => void;
}) {
  return (
    <View className="flex-row bg-white mx-4 mt-4 mb-2 p-1 rounded-xl border border-gray-200">
      <Pressable
        onPress={() => onSelect("bookings")}
        className="flex-1 py-3 rounded-lg"
        style={{
          backgroundColor:
            selected === "bookings" ? AppColor.PRIMARY : "transparent",
        }}
      >
        <Text
          className={`text-center font-semibold ${
            selected === "bookings" ? "text-white" : "text-gray-600"
          }`}
        >
          Lịch sử đặt chỗ
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onSelect("violations")}
        className="flex-1 py-3 rounded-lg"
        style={{
          backgroundColor:
            selected === "violations" ? AppColor.PRIMARY : "transparent",
        }}
      >
        <Text
          className={`text-center font-semibold ${
            selected === "violations" ? "text-white" : "text-gray-600"
          }`}
        >
          Vi phạm
        </Text>
      </Pressable>
    </View>
  );
}

// Status Filter Component
function FilterStatus({
  selected,
  onSelect,
}: {
  selected: StatusFilter;
  onSelect: (filter: StatusFilter) => void;
}) {
  return (
    <View className="bg-white mx-4 mb-3 rounded-xl border border-gray-200 p-2">
      <Text className="text-gray-700 font-semibold text-sm mb-2 px-2">
        Lọc theo trạng thái
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        {STATUS_FILTERS.map((filter) => {
          const isSelected = selected === filter.value;
          return (
            <Pressable
              key={filter.value}
              onPress={() => onSelect(filter.value)}
              className="mr-2 px-4 py-2 rounded-lg flex-row items-center"
              style={{
                backgroundColor: isSelected ? AppColor.PRIMARY : "#f3f4f6",
              }}
            >
              <Ionicons
                name={filter.icon as any}
                size={16}
                color={isSelected ? "white" : "#6b7280"}
              />
              <Text
                className={`ml-2 font-medium text-sm ${
                  isSelected ? "text-white" : "text-gray-700"
                }`}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Booking History Item Component
function BookingHistoryItem({ item }: { item: ReservationHistory }) {
  const status = getStatusLabel(item.status);
  const icon = mapVehicleIcon(item.vehicle_snapshot?.vehicle_type!);

  return (
    <View className="bg-white mx-4 mb-3 rounded-xl border border-gray-200 p-4 shadow-sm relative">
      <View
        className="absolute top-4 right-4 px-2 py-1 rounded-full"
        style={{ backgroundColor: status.bgColor }}
      >
        {status.label}
      </View>

      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Ionicons name="ticket" size={18} color="orange" />
            <Text className="text-lg font-bold text-gray-800 ml-2">
              {item.reservation_code}
            </Text>
          </View>
          <Text className="text-sm text-gray-500 mt-1">
            {formatDate(item.start_time)}
          </Text>
        </View>
      </View>

      {/* Parking Lot & Slot */}
      <View className="mb-3 pb-3 border-b border-gray-100">
        {item.slot?.parking_lot && (
          <View className="flex-row items-center mb-2">
            <Ionicons name="business" size={16} color="#6b7280" />
            <Text className="text-gray-800 font-medium text-sm ml-2">
              {item.slot.parking_lot.name}
            </Text>
          </View>
        )}
        <View className="flex-row items-center mb-2">
          <Ionicons name="location" size={16} color="#6b7280" />
          <Text className="text-gray-600 text-sm ml-2">
            {item.slot?.slot_code || "N/A"}
          </Text>
        </View>
        {item.gate && (
          <View className="flex-row items-center">
            <Ionicons name="git-branch" size={16} color="#6b7280" />
            <Text className="text-gray-600 text-sm ml-2">
              Cổng: {item.gate.gate_code} ({getGateTypeLabel(item.gate.gate_type)})
            </Text>
          </View>
        )}
      </View>

      {/* Vehicle Info */}
      <View className="mb-3 pb-3 border-b border-gray-100">
        <View className="flex-row items-center">
          {icon("#6b7280", 16)}
          <Text className="text-gray-600 text-sm ml-2">
            {getVehicleTypeLabel(item.vehicle_snapshot?.vehicle_type)} •{" "}
            {item.vehicle_snapshot?.license_plate || "N/A"}
          </Text>
        </View>
      </View>

      {/* Time Info */}
      <View className="space-y-2 mb-3">
        <View className="flex-row items-center">
          <Ionicons name="time" size={16} color="#6b7280" />
          <Text className="text-gray-600 text-sm ml-2">
            Bắt đầu: {formatDateTime(item.start_time)}
          </Text>
        </View>

        {item.end_time && (
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text className="text-gray-600 text-sm ml-2">
              Kết thúc: {formatDateTime(item.end_time)}
            </Text>
          </View>
        )}

        {item.check_in_at && (
          <View className="flex-row items-center ">
            <MaterialCommunityIcons name="login" size={16} color="#16a34a" />
            <Text className="text-green-600 text-sm ml-2">
              Check-in: {formatDateTime(item.check_in_at)}
            </Text>
          </View>
        )}

        {item.check_out_at && (
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="logout" size={16} color="#dc2626" />
            <Text className="text-red-600 text-sm ml-2">
              Check-out: {formatDateTime(item.check_out_at)}
            </Text>
          </View>
        )}

        {item.cancelled_at && (
          <View className="flex-row items-center">
            <Ionicons name="close-circle" size={16} color="#dc2626" />
            <Text className="text-red-600 text-sm ml-2">
              Hủy lúc: {formatDateTime(item.cancelled_at)}
            </Text>
          </View>
        )}

        {item.extension_count > 0 && (
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="repeat" size={16} color="#ca8a04" />
            <Text className="text-yellow-600 text-sm ml-2">
              Đã gia hạn {item.extension_count} lần
            </Text>
          </View>
        )}
      </View>

      {/* Payment Info */}
      {item.payment && (
        <View className="pt-3 border-t border-gray-100">
          <View className="flex-row items-center justify-between bg-blue-50 p-2 rounded-lg">
            <View className="flex-row items-center">
              <Ionicons name="card" size={16} color="#3b82f6" />
              <Text className="text-gray-700 font-medium text-sm ml-2">
                Thanh toán:
              </Text>
            </View>
            <Text className="text-blue-600 font-bold text-sm">
              {item.payment.amount.toLocaleString("vi-VN")} đ
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// Violation Item Component
function ViolationItem({ item }: { item: Violation }) {
  return (
    <View className="bg-white mx-4 mb-3 rounded-xl border border-red-200 p-4 shadow-sm">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View className="bg-red-100 p-2 rounded-full mr-3">
            <Ionicons name="warning" size={20} color="#ef4444" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-800">
              {item.violation_type || "Vi phạm"}
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              {formatDate(item.created_at)}
            </Text>
          </View>
        </View>
        <View className="bg-red-50 px-3 py-1 rounded-full">
          <Text className="text-red-600 font-bold text-sm">
            {item.fine_amount.toLocaleString("vi-VN")} đ
          </Text>
        </View>
      </View>

      {/* Description */}
      {item.description && (
        <Text className="text-gray-600 text-sm mb-3">{item.description}</Text>
      )}

      {/* Details */}
      <View className="space-y-2 pt-2 border-t border-gray-100">
        {item.reservation_code && (
          <View className="flex-row items-center">
            <Ionicons name="receipt" size={16} color="#6b7280" />
            <Text className="text-gray-600 text-sm ml-2">
              Mã đặt chỗ: {item.reservation_code}
            </Text>
          </View>
        )}

        {item.slot_code && (
          <View className="flex-row items-center">
            <Ionicons name="location" size={16} color="#6b7280" />
            <Text className="text-gray-600 text-sm ml-2">
              Vị trí: {item.slot_code}
            </Text>
          </View>
        )}

        {item.license_plate && (
          <View className="flex-row items-center">
            <Ionicons name="car" size={16} color="#6b7280" />
            <Text className="text-gray-600 text-sm ml-2">
              Biển số: {item.license_plate}
            </Text>
          </View>
        )}

        <View className="flex-row items-center">
          <Ionicons name="time" size={16} color="#6b7280" />
          <Text className="text-gray-600 text-sm ml-2">
            {formatDateTime(item.created_at)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function HistoryBooking() {
  const [activeTab, setActiveTab] = useState<TabType>("bookings");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [initialLoading, setInitialLoading] = useState(true); // Chỉ dùng cho lần load đầu tiên
  const [loadingContent, setLoadingContent] = useState(false); // Loading khi đổi tab/filter
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<ReservationHistory[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);

  const loadData = useCallback(
    async (isRefresh = false, isFilterChange = false) => {
      try {
        // Chỉ hiển thị full screen loading ở lần đầu tiên
        if (!isRefresh && !isFilterChange) {
          setInitialLoading(true);
        } else if (isFilterChange) {
          // Khi đổi filter/tab, chỉ set loading content
          setLoadingContent(true);
        }

        const user = await getProfile();
        const userId = user.id;

        if (activeTab === "bookings") {
          const result = await getAllReservations(
            userId,
            1,
            50,
            statusFilter === "all" ? undefined : statusFilter
          );
          setBookings(result.reservations);
        } else {
          const data = await getViolations(userId);
          setViolations(data);
        }
      } catch (error: any) {
        console.error("Error loading history:", error);
        Alert.alert(
          "Lỗi",
          error.response?.data?.message ||
            "Không thể tải dữ liệu. Vui lòng thử lại."
        );
      } finally {
        setInitialLoading(false);
        setLoadingContent(false);
        setRefreshing(false);
      }
    },
    [activeTab, statusFilter]
  );

  // Load data khi mount hoặc focus
  useFocusEffect(
    useCallback(() => {
      // Reset về filter "all" khi focus lại màn hình
      setStatusFilter("all");
      loadData(false, false);
    }, [])
  );

  // Load data khi đổi tab hoặc filter
  useEffect(() => {
    if (!initialLoading) {
      // Chỉ load khi đã load lần đầu rồi
      loadData(false, true);
    }
  }, [activeTab, statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true, false);
  }, [loadData]);

  const currentData = useMemo(() => {
    return activeTab === "bookings" ? bookings : violations;
  }, [activeTab, bookings, violations]);

  // Full screen loading chỉ hiển thị lần đầu
  if (initialLoading) {
    return (
      <View className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center">
        <View className="bg-white p-8 rounded-3xl shadow-lg items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-700 font-medium text-center">
            Đang tải dữ liệu...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
      <TabSelector selected={activeTab} onSelect={setActiveTab} />

      {/* Status Filter - chỉ hiển thị khi tab là bookings */}
      {activeTab === "bookings" && (
        <FilterStatus selected={statusFilter} onSelect={setStatusFilter} />
      )}

      {/* Loading indicator nhỏ khi đổi filter/tab */}
      {loadingContent && (
        <View className="items-center py-2">
          <ActivityIndicator size="small" color="#3b82f6" />
        </View>
      )}

      {!loadingContent && currentData.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <View className="bg-white p-8 rounded-3xl shadow-lg items-center">
            <View className="bg-gray-100 p-6 rounded-full mb-4">
              <Ionicons
                name={
                  activeTab === "bookings" ? "time-outline" : "warning-outline"
                }
                size={48}
                color="#9ca3af"
              />
            </View>
            <Text className="text-gray-600 font-medium text-lg mb-2">
              {activeTab === "bookings"
                ? "Chưa có lịch sử đặt chỗ"
                : "Chưa có vi phạm"}
            </Text>
            <Text className="text-gray-500 text-center text-sm leading-5">
              {activeTab === "bookings"
                ? statusFilter === "all"
                  ? "Bạn chưa có lịch sử đặt chỗ nào.\nCác đặt chỗ đã hoàn thành sẽ hiển thị ở đây."
                  : `Không có đặt chỗ nào với trạng thái "${
                      STATUS_FILTERS.find((f) => f.value === statusFilter)
                        ?.label
                    }".`
                : "Bạn chưa có vi phạm nào.\nHãy tuân thủ quy định để tránh vi phạm."}
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={currentData as (ReservationHistory | Violation)[]}
          keyExtractor={(item) =>
            activeTab === "bookings"
              ? String((item as ReservationHistory).id)
              : String((item as unknown as Violation).id)
          }
          renderItem={({ item }) =>
            activeTab === "bookings" ? (
              <BookingHistoryItem item={item as ReservationHistory} />
            ) : (
              <ViolationItem item={item as unknown as Violation} />
            )
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
              colors={["#3b82f6"]}
            />
          }
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
          ListEmptyComponent={
            loadingContent ? (
              <View className="items-center py-8">
                <ActivityIndicator size="small" color="#3b82f6" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
