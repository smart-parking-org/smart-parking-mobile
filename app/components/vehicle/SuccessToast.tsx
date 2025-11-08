import React from "react";
import { View, Text, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type SuccessToastProps = {
  message: string | null;
  fadeAnim: Animated.Value;
};

export function SuccessToast({ message, fadeAnim }: SuccessToastProps) {
  if (!message) return null;

  return (
    <Animated.View
      className="absolute top-20 left-5 right-5 z-50"
      style={{ opacity: fadeAnim }}
    >
      <View className="bg-emerald-500 rounded-2xl px-5 py-4 flex-row items-center shadow-lg">
        <Ionicons name="checkmark-circle" size={22} color="#fff" />
        <Text className="text-white font-semibold ml-3 text-base flex-1">
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
