import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColor } from "@/lib/utils/color";

type EmptyStateProps = {
  onAdd: () => void;
  buttonLabel?: string;
  title?: string;
  subtitle?: string;
  disabled?: boolean;
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  onAdd,
  buttonLabel = "Thêm phương tiện đầu tiên",
  title = "Chưa có phương tiện",
  subtitle = "Thêm phương tiện để bắt đầu sử dụng dịch vụ đặt chỗ nhanh chóng và tiện lợi.",
  disabled = false,
}) => {
  const handlePress = async () => {
    if (disabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onAdd();
  };

  return (
    <View className="flex-1 items-center justify-center px-6">
      {/* Icon vòng tròn nhạt */}
      <View
        className="w-28 h-28 rounded-2xl items-center justify-center mb-5"
        style={{
          backgroundColor: `${AppColor.PRIMARY}12`,
          borderWidth: 1,
          borderColor: `${AppColor.PRIMARY}22`,
        }}
      >
        <Ionicons name="car-outline" size={44} color={AppColor.PRIMARY} />
      </View>

      {/* Tiêu đề & mô tả */}
      <Text className="text-xl font-extrabold text-gray-900 text-center mb-2">
        {title}
      </Text>
      <Text className="text-gray-500 text-center leading-6 mb-6">
        {subtitle}
      </Text>

      {/* Nút hành động */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        className={`h-12 px-5 rounded-xl items-center justify-center ${
          disabled ? "bg-gray-300" : ""
        }`}
        style={{
          backgroundColor: disabled ? undefined : AppColor.PRIMARY,
          shadowColor: disabled ? "transparent" : AppColor.PRIMARY,
          shadowOpacity: disabled ? 0 : 0.16,
          shadowRadius: disabled ? 0 : 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: disabled ? 0 : 2,
          minWidth: 220,
        }}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
      >
        <Text className="text-white font-bold">{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};
