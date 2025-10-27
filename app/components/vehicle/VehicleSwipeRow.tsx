import React, { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  Ionicons,
  FontAwesome,
  FontAwesome5,
  Fontisto,
} from "@expo/vector-icons";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Type phù hợp với backend
export type Vehicle = {
  id: number;
  vehicle_type?: "motorbike" | "car_4_seat" | "car_7_seat" | "light_truck";
  license_plate: string;
  is_primary?: boolean;
  is_active?: boolean;
};

type Props = {
  v: Vehicle;
  onEdit?: (v: Vehicle) => void;
  onDelete?: (v: Vehicle) => void;
  onPress?: (v: Vehicle) => void;
  canDelete?: boolean;
};

// Hàm helper để hiển thị tên loại xe
export function getVehicleDisplayName(type?: Vehicle["vehicle_type"]): string {
  if (!type) return "Không xác định";
  const names = {
    motorbike: "Xe máy",
    car_4_seat: "Xe ô tô 4 chỗ",
    car_7_seat: "Xe ô tô 7 chỗ",
    light_truck: "Xe tải nhẹ",
  };
  return names[type] || type;
}

export default function VehicleSwipeRow({
  v,
  onEdit,
  onDelete,
  onPress,
  canDelete = true,
}: Props) {
  const swipeRef = useRef<Swipeable>(null);

  // Xác định màu và icon dựa trên loại xe
  const getColorAndIcon = () => {
    const type = v.vehicle_type;

    if (!type) {
      return { color: "#94a3b8", icon: "truck", iconType: FontAwesome5 };
    }

    if (type === "motorbike") {
      return { color: "#06b6d4", icon: "motorcycle", iconType: Fontisto };
    } else if (type === "car_4_seat") {
      return { color: "#22c55e", icon: "car-sport", iconType: Ionicons };
    } else if (type === "car_7_seat") {
      return { color: "#f5d549", icon: "car-side", iconType: FontAwesome5 };
    } else {
      return { color: "#8b5cf4", icon: "truck", iconType: FontAwesome5 };
    }
  };

  const { color, icon, iconType } = getColorAndIcon();
  const IconComponent = iconType;

  const renderRightActions = () => (
    <View style={styles.actionsContainer}>
      {/* Nút Sửa */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.actionButton, styles.editButton]}
        onPress={() => {
          swipeRef.current?.close();
          onEdit?.(v);
        }}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="pencil" size={20} color="#fff" />
        </View>
        <Text style={styles.actionText}>Sửa</Text>
      </TouchableOpacity>

      {/* Nút Xóa */}
      <TouchableOpacity
        disabled={!canDelete}
        activeOpacity={0.85}
        style={[
          styles.actionButton,
          styles.deleteButton,
          !canDelete && styles.disabledButton,
        ]}
        onPress={() => {
          swipeRef.current?.close();
          onDelete?.(v);
        }}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="trash" size={20} color="#fff" />
        </View>
        <Text style={styles.actionText}>Xóa</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Swipeable
        ref={swipeRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={2}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onPress?.(v)}
          className="px-4 py-4 bg-white rounded-2xl flex-row items-center mb-3 shadow-sm"
          style={{
            borderLeftWidth: 4,
            borderLeftColor: color,
            elevation: 2,
          }}
        >
          {/* Icon bên trái */}
          <View
            className="w-14 h-14 rounded-xl items-center justify-center mr-4"
            style={{ backgroundColor: `${color}15` }}
          >
            <IconComponent name={icon} size={28} color={color} />
          </View>

          {/* Thông tin xe */}
          <View className="flex-1">
            <Text className="text-[14px] text-gray-900 font-semibold mb-1">
              {getVehicleDisplayName(v.vehicle_type)}
            </Text>
            <Text className="text-[13px] text-gray-600 font-medium">
              {v.license_plate}
            </Text>
            {v.is_primary && (
              <View className="mt-1.5 self-start">
                <View className="bg-emerald-50 px-2 py-0.5 rounded-md">
                  <Text className="text-[10px] text-emerald-700 font-semibold">
                    ⭐ Mặc định
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Chevron icon */}
          <View className="ml-2">
            <Ionicons name="chevron-back" size={20} color="#cbd5e1" />
          </View>
        </TouchableOpacity>
      </Swipeable>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: "row",
    alignItems: "stretch",
    height: "88%",
    borderRadius: 16,
    overflow: "hidden",
  },
  actionButton: {
    width: 85,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  editButton: {
    backgroundColor: "#2563EB",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    marginRight: 1,
  },
  deleteButton: {
    backgroundColor: "#DC2626",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  actionText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
