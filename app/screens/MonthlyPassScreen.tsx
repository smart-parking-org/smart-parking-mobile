import { AppColor } from "@/lib/utils/color";
import { Stack } from "expo-router";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function MonthlyPassScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "VÉ THÁNG",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: AppColor.PRIMARY },
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: "800",
            fontSize: 16,
            color: "#fff",
          },
          headerTintColor: "#fff",
        }}
      />
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      >
        <ScrollView className="flex-1">
          <View className="px-4 pt-4 pb-8">
            {/* Danh sách vé tháng đã đăng ký */}
            <Text className="border-l-4 border-blue-600 pl-2 mb-3 font-semibold text-base">
              Vé tháng của tôi
            </Text>
            <View className="bg-white rounded-xl p-8 items-center border border-gray-200 shadow-sm">
              <View className="bg-gray-100 p-6 rounded-full mb-4">
                <Ionicons name="ticket-outline" size={48} color="#9ca3af" />
              </View>
              <Text className="text-gray-600 font-medium text-lg mb-2">
                Chưa có vé tháng
              </Text>
              <Text className="text-gray-500 text-center text-sm">
                Bạn chưa đăng ký vé tháng nào.{"\n"}
                Chọn bãi đỗ và loại xe bên dưới để đăng ký ngay!
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
