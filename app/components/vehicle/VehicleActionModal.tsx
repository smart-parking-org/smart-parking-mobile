import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { type Vehicle } from "./VehicleCard";

type VehicleActionModalProps = {
  visible: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  slideAnim: Animated.Value;
};

export function VehicleActionModal({
  visible,
  vehicle,
  onClose,
  onEdit,
  onSetDefault,
  onDelete,
  slideAnim,
}: VehicleActionModalProps) {
  if (!vehicle) return null;

  const isPrimary = Boolean(vehicle.is_primary);
  const inactive = vehicle.is_active === false;

  const actions = [
    {
      id: "edit",
      label: "Chỉnh sửa",
      icon: "pencil" as const,
      color: "#374151",
      bgColor: "#F3F4F6",
      onPress: onEdit,
      disabled: inactive,
    },
    ...(isPrimary
      ? []
      : [
          {
            id: "setDefault",
            label: "Đặt làm mặc định",
            icon: "star" as const,
            color: "#F59E0B",
            bgColor: "#FEF3C7",
            onPress: onSetDefault,
            disabled: inactive,
          },
        ]),
    {
      id: "delete",
      label: "Xóa phương tiện",
      icon: "trash-outline" as const,
      color: "#DC2626",
      bgColor: "#FEE2E2",
      onPress: onDelete,
      disabled: false,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={onClose}
        activeOpacity={1}
      >
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Pressable
            className="bg-white rounded-t-[32px] overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <View className="items-center pt-4 pb-2">
              <View className="w-12 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Header */}
            <View className="px-6 pb-4 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-900">
                {vehicle.license_plate}
              </Text>
              <Text className="text-sm text-gray-500 mt-1">Chọn hành động</Text>
            </View>

            {/* Actions */}
            <View className="px-4 py-2">
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={action.id}
                  onPress={() => {
                    if (!action.disabled) {
                      action.onPress();
                      onClose();
                    }
                  }}
                  disabled={action.disabled}
                  className="flex-row items-center px-4 py-4 rounded-2xl mb-2"
                  style={{
                    backgroundColor: action.disabled
                      ? "#F9FAFB"
                      : action.bgColor,
                    opacity: action.disabled ? 0.5 : 1,
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{
                      backgroundColor: action.disabled
                        ? "#E5E7EB"
                        : `${action.color}20`,
                    }}
                  >
                    <Ionicons
                      name={action.icon}
                      size={20}
                      color={action.disabled ? "#9CA3AF" : action.color}
                    />
                  </View>
                  <Text
                    className="flex-1 text-base font-semibold"
                    style={{
                      color: action.disabled ? "#9CA3AF" : "#111827",
                    }}
                  >
                    {action.label}
                  </Text>
                  {action.disabled && (
                    <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Cancel button */}
            <View className="px-4 pb-6 pt-2">
              <TouchableOpacity
                onPress={onClose}
                className="h-12 rounded-2xl items-center justify-center border-2 border-gray-200"
                activeOpacity={0.8}
              >
                <Text className="text-gray-700 font-semibold text-base">
                  Hủy
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
