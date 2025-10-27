import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

const INACTIVE = "#D1D5DB"; // xám nhạt
const ACTIVE = "#60A5FA"; // xanh nhạt

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="HomeScreen" // khớp tên file HomeScreen.tsx
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          height: 80,
          paddingTop: 10,
        },
      }}
    >
      {/* Map */}
      <Tabs.Screen
        name="MapParking"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="location-outline" size={28} color={color} />
          ),
          title: "Map",
        }}
      />

      {/* QR (tạo file app/screens/tab/QRScreen.tsx nếu chưa có) */}
      <Tabs.Screen
        name="QRScreen"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="qr-code-outline" size={28} color={color} />
          ),
          title: "QR",
        }}
      />

      {/* HOME ở giữa – icon nổi bật */}
      <Tabs.Screen
        name="HomeScreen"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) =>
            focused ? (
              <LinearGradient
                colors={["#8EC5FF", "#5AA8FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="home" size={30} color="#fff" />
              </LinearGradient>
            ) : (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="home" size={30} color={INACTIVE} />
              </View>
            ),
        }}
      />

      {/* History (tạo file app/screens/tab/HistoryBooking.tsx nếu chưa có) */}
      <Tabs.Screen
        name="HistoryBooking"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="time-outline" size={28} color={color} />
          ),
          title: "History",
        }}
      />

      {/* Settings */}
      <Tabs.Screen
        name="SettingScreen"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={28} color={color} />
          ),
          title: "Setting",
        }}
      />
    </Tabs>
  );
}
