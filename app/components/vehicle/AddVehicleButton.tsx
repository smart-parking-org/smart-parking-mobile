import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColor } from "@/lib/utils/color";

type AddVehicleButtonProps = {
  onPress: () => void;
};

export function AddVehicleButton({ onPress }: AddVehicleButtonProps) {
  return (
    <View className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-4 bg-white border-t border-gray-100">
      <TouchableOpacity
        onPress={onPress}
        className="h-14 rounded-2xl items-center justify-center flex-row"
        style={{
          backgroundColor: AppColor.PRIMARY,
          shadowColor: AppColor.PRIMARY,
          shadowOpacity: 0.3,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 5,
        }}
        activeOpacity={0.85}
      >
        <View className="w-8 h-8 rounded-full items-center justify-center bg-white/20 mr-2">
          <Ionicons name="add" size={22} color="#fff" />
        </View>
        <Text className="text-white font-bold text-base">Thêm phương tiện</Text>
      </TouchableOpacity>
    </View>
  );
}
