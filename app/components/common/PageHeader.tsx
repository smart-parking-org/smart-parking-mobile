import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showHome?: boolean;
  onBack?: () => void;
  onHome?: () => void;
  homeRoute?: string;
  rightComponent?: React.ReactNode;
};

export function PageHeader({
  title,
  subtitle,
  showBack = true,
  showHome = true,
  onBack,
  onHome,
  homeRoute = "/screens/tab/HomeScreen",
  rightComponent,
}: PageHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else if (homeRoute) {
      router.push(homeRoute as any);
    }
  };

  return (
    <View
      className="px-6 pt-12 pb-6 bg-blue-600"
      style={{ borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}
    >
      <View className="flex-row items-center justify-between">
        {/* Left: Back button */}
        {showBack ? (
          <Pressable
            onPress={handleBack}
            className="h-12 w-12 items-center justify-center bg-white rounded-full shadow-sm"
          >
            <Ionicons name="chevron-back" size={24} color="#374151" />
          </Pressable>
        ) : (
          <View className="h-12 w-12" />
        )}

        {/* Center: Title and Subtitle */}
        <View className="flex-1 items-center px-4">
          <Text className="text-2xl font-bold text-white" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right: Home button or custom component */}
        {rightComponent ? (
          rightComponent
        ) : showHome ? (
          <Pressable
            onPress={handleHome}
            className="h-12 w-12 items-center justify-center bg-white rounded-full shadow-sm"
          >
            <Ionicons name="home" size={24} color="#374151" />
          </Pressable>
        ) : (
          <View className="h-12 w-12" />
        )}
      </View>
    </View>
  );
}
