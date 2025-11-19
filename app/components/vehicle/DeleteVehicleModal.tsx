import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { type Vehicle } from "./VehicleCard";

type DeleteVehicleModalProps = {
  visible: boolean;
  vehicle: Vehicle | null;
  deletingId: number | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteVehicleModal({
  visible,
  vehicle,
  deletingId,
  onCancel,
  onConfirm,
}: DeleteVehicleModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center px-6"
        onPress={onCancel}
      >
        <Pressable
          className="bg-white rounded-3xl p-6 w-full max-w-sm"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
              <Ionicons name="trash" size={28} color="#DC2626" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2">
              Xóa phương tiện?
            </Text>
            <Text className="text-sm text-gray-600 text-center leading-5">
              Bạn có chắc chắn muốn xóa phương tiện{" "}
              <Text className="font-bold text-gray-900">
                {vehicle?.license_plate}
              </Text>
              ? Hành động này không thể hoàn tác.
            </Text>
          </View>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 h-12 rounded-xl items-center justify-center border-2 border-gray-200"
              activeOpacity={0.8}
            >
              <Text className="text-gray-700 font-semibold">Giữ lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={deletingId !== null}
              className="flex-1 h-12 rounded-xl items-center justify-center"
              style={{
                backgroundColor: deletingId !== null ? "#9CA3AF" : "#DC2626",
              }}
              activeOpacity={0.8}
            >
              {deletingId !== null ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold">Xóa ngay</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
