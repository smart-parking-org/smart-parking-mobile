import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import type {
  Vehicle as VehicleModel,
  VehicleStatus,
} from "@/lib/api/vehicles";

export type Vehicle = VehicleModel;

type VehicleCardProps = {
  vehicle: Vehicle;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onOpenActions: () => void; // Thêm prop mới
  busy?: boolean;
};

function getVehicleColorAndIcon(vehicle: Vehicle) {
  const type = vehicle.vehicle_type;
  const colors = {
    motorbike: {
      primary: "#0EA5E9",
      light: "#E0F2FE",
      icon: (color: string) => (
        <MaterialIcons name="two-wheeler" size={22} color={color} />
      ),
    },
    car_4_seat: {
      primary: "#10B981",
      light: "#D1FAE5",
      icon: (color: string) => (
        <MaterialCommunityIcons name="car-side" size={22} color={color} />
      ),
    },
    car_7_seat: {
      primary: "#F59E0B",
      light: "#FEF3C7",
      icon: (color: string) => (
        <MaterialCommunityIcons name="car-estate" size={22} color={color} />
      ),
    },
    light_truck: {
      primary: "#8B5CF6",
      light: "#EDE9FE",
      icon: (color: string) => (
        <MaterialCommunityIcons name="truck" size={22} color={color} />
      ),
    },
  } as const;

  return colors[type];
}

function getVehicleDisplayName(type?: Vehicle["vehicle_type"]): string {
  if (!type) return "Chưa xác định";
  const names = {
    motorbike: "Xe máy",
    car_4_seat: "Ô tô 4 chỗ",
    car_7_seat: "Ô tô 7 chỗ",
    light_truck: "Xe tải nhẹ",
  };
  return names[type] || type;
}

function getStatusBadge(
  status?: VehicleStatus
): {
  label: string;
  bgColor: string;
  textColor: string;
  icon: React.ReactNode;
} | null {
  if (!status) return null;
  const config = {
    approved: {
      label: "Đã duyệt",
      bgColor: "#ECFDF5",
      textColor: "#047857",
      icon: (
        <Ionicons name="checkmark-circle" size={12} color="#047857" />
      ),
    },
    pending: {
      label: "Chờ duyệt",
      bgColor: "#FEF3C7",
      textColor: "#B45309",
      icon: <Ionicons name="time-outline" size={12} color="#B45309" />,
    },
    rejected: {
      label: "Bị từ chối",
      bgColor: "#FEE2E2",
      textColor: "#B91C1C",
      icon: <Ionicons name="close-circle" size={12} color="#B91C1C" />,
    },
  } as const;

  return config[status] ?? null;
}

export function CompactVehicleCard({
  vehicle,
  onEdit,
  onDelete,
  onSetDefault,
  onOpenActions, // Thêm prop mới
  busy,
}: VehicleCardProps) {
  const { primary, light, icon } = getVehicleColorAndIcon(vehicle);
  const isPrimary = !!vehicle.is_primary;
  const statusBadge = getStatusBadge(vehicle.status);
  const awaitingApproval = vehicle.status && vehicle.status !== "approved";
  const inactive = vehicle.is_active === false;
  const dimmed = inactive || awaitingApproval;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: isPrimary ? light : "#FFFFFF",
        borderWidth: isPrimary ? 2 : 1,
        borderColor: isPrimary ? primary : "#E5E7EB",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
        opacity: busy ? 0.6 : dimmed ? 0.9 : 1,
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: primary,
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
        }}
      />

      {/* Icon */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: `${primary}20`,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        {icon(primary)}
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: inactive ? "#6B7280" : "#0F172A",
              marginRight: 8,
            }}
            numberOfLines={1}
          >
            {vehicle.license_plate}
          </Text>

          {isPrimary && (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: primary,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#fff" }}>
                Mặc định
              </Text>
            </View>
          )}

          {statusBadge && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: statusBadge.bgColor,
                marginTop: 4,
              }}
            >
              {statusBadge.icon}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: statusBadge.textColor,
                  marginLeft: 4,
                }}
              >
                {statusBadge.label}
              </Text>
            </View>
          )}
        </View>

        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}
        >
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
              backgroundColor: "#F3F4F6",
            }}
          >
            <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "600" }}>
              {getVehicleDisplayName(vehicle.vehicle_type)}
            </Text>
          </View>

          {inactive && (
            <View
              style={{
                marginLeft: 8,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 8,
                backgroundColor: "#FEF2F2",
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Ionicons name="lock-closed" size={12} color="#DC2626" />
              <Text
                style={{ fontSize: 11, color: "#DC2626", fontWeight: "700" }}
              >
                Không hoạt động
              </Text>
            </View>
          )}
        </View>

        {vehicle.status !== "approved" && (
          <Text
            style={{
              marginTop: 6,
              fontSize: 12,
              color: vehicle.status === "rejected" ? "#B91C1C" : "#92400E",
              fontWeight: "600",
            }}
          >
            {vehicle.status === "rejected"
              ? "Phương tiện đã bị từ chối, vui lòng chỉnh sửa và gửi lại."
              : "Phương tiện đang chờ admin duyệt trước khi có thể sử dụng."}
          </Text>
        )}

        {inactive && vehicle.status === "approved" && (
          <Text
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "#DC2626",
              fontWeight: "600",
            }}
          >
            Phương tiện hiện đang bị khóa, vui lòng liên hệ hỗ trợ.
          </Text>
        )}
      </View>

      {/* Action button - 3 chấm dọc */}
      <TouchableOpacity
        onPress={onOpenActions}
        disabled={busy}
        activeOpacity={0.7}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: "#F3F4F6",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 8,
          opacity: busy ? 0.5 : 1,
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="ellipsis-vertical" size={20} color="#374151" />
      </TouchableOpacity>
    </View>
  );
}
