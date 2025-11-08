import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColor } from "@/lib/utils/color";
import { type Vehicle } from "./VehicleCard";

type ScreenHeaderProps = {
  total: number;
  filtered: number;
  primary?: Vehicle;
};

export function ScreenHeader({ total, filtered, primary }: ScreenHeaderProps) {
  const isFiltered = filtered !== total;

  return (
    <View
      className="px-5 pt-4 pb-3 bg-white"
      style={{ borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}
    >
      {/* Hàng trên: tiêu đề + badge */}
      <View className="flex-row items-center justify-between">
        <View style={{ flexShrink: 1, paddingRight: 10 }}>
          <View className="flex-row items-center">
            <Text
              className="text-[17px] font-extrabold text-gray-900"
              numberOfLines={1}
            >
              Phương tiện
            </Text>

            {/* Badge tổng */}
            <View
              className="ml-2 px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${AppColor.PRIMARY}15` }}
            >
              <Text
                className="text-[11px] font-bold"
                style={{ color: AppColor.PRIMARY }}
              >
                {total}
              </Text>
            </View>

            {/* Badge đã lọc (nếu có) */}
            {isFiltered && (
              <View className="ml-2 px-2 py-0.5 rounded-full bg-gray-100">
                <Text className="text-[11px] font-semibold text-gray-700">
                  Đã lọc: {filtered}
                </Text>
              </View>
            )}
          </View>

          {/* Chip mặc định */}
          {primary && (
            <View className="mt-2 self-start flex-row items-center px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200">
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text className="ml-1 text-[12px] font-semibold text-gray-700">
                Mặc định:
              </Text>
              <Text
                className="ml-4 text-[12px] font-bold text-gray-900"
                numberOfLines={1}
              >
                {primary.license_plate}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
