import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppColor } from "@/lib/utils/color";

export default function StaffTabLayout() {
  return (
    <Tabs
      initialRouteName="SendNotificationScreen"
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: AppColor.PRIMARY,
        tabBarInactiveTintColor: "#94a3b8",
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: AppColor.PRIMARY },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 16,
          color: "#fff",
        },
        headerTintColor: "#fff",
        tabBarStyle: {
          height: 70,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="SendNotificationScreen"
        options={{
          title: "GỬI THÔNG BÁO",
          tabBarLabel: "Thông báo",
          tabBarIcon: ({ color }) => (
            <Ionicons name="paper-plane-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="AccountScreen"
        options={{
          title: "TÀI KHOẢN",
          tabBarLabel: "Tài khoản",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

