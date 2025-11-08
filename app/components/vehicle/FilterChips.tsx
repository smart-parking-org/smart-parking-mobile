import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColor } from "@/lib/utils/color";

const TYPE_FILTERS = [
  {
    label: "Tất cả",
    value: "all",
    icon: (color: string) => <Ionicons name="apps" size={16} color={color} />,
  },
  {
    label: "Xe máy",
    value: "motorbike",
    icon: (color: string) => (
      <MaterialIcons name="two-wheeler" size={22} color={color} />
    ),
  },
  {
    label: "Ô tô 4 chỗ",
    value: "car_4_seat",
    icon: (color: string) => (
      <MaterialCommunityIcons name="car-side" size={22} color={color} />
    ),
  },
  {
    label: "Ô tô 7 chỗ",
    value: "car_7_seat",
    icon: (color: string) => (
      <MaterialCommunityIcons name="car-estate" size={22} color={color} />
    ),
  },
  {
    label: "Xe tải",
    value: "light_truck",
    icon: (color: string) => (
      <MaterialCommunityIcons name="truck" size={22} color={color} />
    ),
  },
];

type FilterChipsProps = {
  selected: string;
  onSelect: (value: string) => void;
};

export function FilterChips({ selected, onSelect }: FilterChipsProps) {
  return (
    <View className="bg-white border-b border-gray-100">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 12,
          paddingRight: 20,
        }}
        style={{ flexGrow: 0 }}
      >
        {TYPE_FILTERS.map((filter) => {
          const active = selected === filter.value;
          const iconColor = active ? "#fff" : "#6B7280";
          return (
            <TouchableOpacity
              key={filter.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(filter.value);
              }}
              className="flex-row items-center px-4 py-2 rounded-full mr-2"
              style={{
                backgroundColor: active ? AppColor.PRIMARY : "#F3F4F6",
                minWidth: 80,
              }}
              activeOpacity={0.7}
            >
              {filter.icon(iconColor)}
              <Text
                className="ml-2 text-sm font-semibold"
                numberOfLines={1}
                style={{ color: active ? "#fff" : "#6B7280" }}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
