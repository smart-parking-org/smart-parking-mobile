import React from "react";
import { Text, TextInput, View, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type FieldProps = {
  label: string;
  error?: string | null;
} & TextInputProps;

export default function Field({
  label,
  error,
  style,
  placeholderTextColor = "#9ca3af",
  ...inputProps
}: FieldProps) {
  return (
    <View className="mb-3">
      <View className="flex-row justify-between">
        <Text className="text-gray-600 mb-1">{label}</Text>
        {error ? <Text className="text-red-500 text-xs">{error}</Text> : null}
      </View>

      <View className="relative">
        <TextInput
          {...inputProps}
          placeholderTextColor={placeholderTextColor}
          className={`h-12 rounded-2xl px-4 border ${
            error ? "border-red-400" : "border-gray-300"
          }`}
          style={style}
        />
        <Ionicons
          name="ellipse-outline"
          size={16}
          color="#cbd5e1"
          style={{ position: "absolute", right: 12, top: 14 }}
        />
      </View>
    </View>
  );
}
