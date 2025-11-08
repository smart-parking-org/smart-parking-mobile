import { Ionicons } from "@expo/vector-icons";
import { TextInput, TouchableOpacity, View } from "react-native";

export const SearchBar = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) => (
  <View className="px-5 pt-4 pb-3 bg-white border-b border-gray-100">
    <View
      className="flex-row items-center px-4 py-1 rounded-2xl"
      style={{
        backgroundColor: "#F3F4F6",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      {/* Icon Search */}
      <Ionicons
        name="search"
        size={20}
        color="#9CA3AF"
        style={{ opacity: 0.7 }}
      />

      {/* Input */}
      <TextInput
        className="flex-1 ml-3 text-base text-gray-900"
        placeholder="Tìm theo biển số xe..."
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={(text) => onChange(text.toUpperCase())}
      />

      {/* Clear Button */}
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange("")} className="ml-2">
          <Ionicons
            name="close-circle"
            size={20}
            color="#9CA3AF"
            style={{ opacity: 0.6 }}
          />
        </TouchableOpacity>
      )}
    </View>
  </View>
);
