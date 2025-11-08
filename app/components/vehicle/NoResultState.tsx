import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type NoResultStateProps = {
  onReset: () => void;
};

export function NoResultState({ onReset }: NoResultStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      {/* Icon */}
      <Ionicons name="file-tray-outline" size={72} color="#A3A3A3" />

      {/* Title */}
      <Text className="text-[18px] font-bold text-gray-900 mt-4">
        Không có dữ liệu phù hợp
      </Text>

      {/* Description */}
      <Text className="text-gray-500 text-center text-sm mt-2 leading-5">
        Rất tiếc, không tìm thấy phương tiện nào trùng khớp với bộ lọc hiện tại.
      </Text>

      {/* Reset Button */}
      <TouchableOpacity
        onPress={onReset}
        activeOpacity={0.85}
        className="mt-7 px-6 py-3 rounded-xl border border-gray-300"
      >
        <Text className="text-gray-700 font-semibold text-[14px]">
          Xem tất cả phương tiện
        </Text>
      </TouchableOpacity>
    </View>
  );
}
