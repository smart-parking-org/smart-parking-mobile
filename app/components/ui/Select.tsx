import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type Option = { label: string; value: string };

type SelectProps = {
  label: string;
  value?: Option | null;
  options: Option[];
  onSelect: (o: Option) => void;
  error?: string | null;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
};

export default function Select({
  label,
  value,
  options,
  onSelect,
  error,
  disabled,
  containerStyle,
  labelStyle,
}: SelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-3" style={containerStyle}>
      <View className="flex-row justify-between">
        <Text className="text-gray-600 mb-1" style={labelStyle}>
          {label}
        </Text>
        {error ? <Text className="text-red-500 text-xs">{error}</Text> : null}
      </View>

      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={`h-12 rounded-2xl px-4 border flex-row items-center justify-between ${
          error ? "border-red-400" : "border-gray-300"
        } ${disabled ? "bg-gray-100" : ""}`}
      >
        <Text className={`${!value ? "text-gray-400" : "text-gray-800"}`}>
          {value ? value.label : "Chọn"}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#9ca3af" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/30"
          onPress={() => setOpen(false)}
        >
          <View className="mt-auto bg-white rounded-t-3xl max-h-[60%]">
            <View className="p-4 border-b border-gray-200">
              <Text className="text-base font-semibold">{label}</Text>
            </View>

            <FlatList
              data={options}
              keyExtractor={(it) => it.value}
              renderItem={({ item }) => (
                <Pressable
                  className="px-5 py-4 border-b border-gray-100"
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <Text className="text-[16px]">{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
