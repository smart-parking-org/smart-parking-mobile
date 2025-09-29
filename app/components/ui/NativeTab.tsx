import React, { useState } from "react";
import { View, Text, Pressable, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type TabKey = "home" | "messages" | "settings";

type PillTabsProps = {
  initial?: TabKey;
  unread?: number; // badge Messages
  alertSettings?: boolean; // dot đỏ Settings
  onChange?: (tab: TabKey) => void;
  containerStyle?: ViewStyle; // vị trí ngoài (vd: absolute bottom)
};

export default function PillTabs({
  initial = "home",
  unread = 0,
  alertSettings = false,
  onChange,
  containerStyle,
}: PillTabsProps) {
  const [active, setActive] = useState<TabKey>(initial);
  const switchTo = (k: TabKey) => {
    setActive(k);
    onChange?.(k);
  };

  const Item = ({
    k,
    label,
    icon,
    showBadge,
    showDot,
  }: {
    k: TabKey;
    label: string;
    icon: React.ReactNode;
    showBadge?: boolean;
    showDot?: boolean;
  }) => (
    <Pressable onPress={() => switchTo(k)} className="flex-1 items-center">
      <View className="relative">
        <View
          className={`w-10 h-10 rounded-full items-center justify-center ${
            active === k ? "bg-white" : ""
          }`}
        >
          {icon}
        </View>
        {showBadge && (
          <View className="absolute -top-1 -right-1 bg-red-500 rounded-full px-1.5">
            <Text className="text-[10px] text-white font-bold">
              {unread > 9 ? "9+" : unread}
            </Text>
          </View>
        )}
        {showDot && (
          <View className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        )}
      </View>
      <Text
        className={`mt-1 text-xs ${
          active === k ? "text-blue-600 font-semibold" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View
      style={containerStyle}
      className="mx-5 bg-gray-100 rounded-full px-3 py-3 flex-row items-center justify-between shadow-sm"
    >
      <Item
        k="home"
        label="Home"
        icon={
          <Ionicons
            name="home"
            size={22}
            color={active === "home" ? "#2563eb" : "#111827"}
          />
        }
      />
      <Item
        k="messages"
        label="Messages"
        icon={
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={22}
            color="#111827"
          />
        }
        showBadge={unread > 0}
      />
      <Item
        k="settings"
        label="Settings"
        icon={<Ionicons name="settings-outline" size={22} color="#111827" />}
        showDot={alertSettings}
      />
    </View>
  );
}
