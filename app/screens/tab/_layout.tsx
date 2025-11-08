import { router, Tabs } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { AppColor } from "@/lib/utils/color";

const INACTIVE = "#99a1af"; // xám nhạt
// const ACTIVE = "#155dfc"; // xanh nhạt
const ACTIVE = AppColor.PRIMARY; // xanh nhạt

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="HomeScreen" // khớp tên file HomeScreen.tsx
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: AppColor.PRIMARY },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "800", fontSize: 16, color: "#fff" },
        headerTintColor: "#fff",
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.push("/screens/tab/HomeScreen")}
          >
            <Image
              source={require("@/assets/logo-white.png")}
              style={{
                width: 35,
                height: 35,
                marginLeft: 12,
                objectFit: "contain",
              }}
            />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push("/screens/tab/HomeScreen")}
            style={{ marginRight: 16 }}
          >
            <View>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              <View
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  backgroundColor: AppColor.DANGER,
                  borderRadius: 8,
                  paddingHorizontal: 4,
                  minWidth: 16,
                  height: 16,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 10 }}>5</Text>
              </View>
            </View>
          </TouchableOpacity>
        ),
        tabBarStyle: {
          height: 80,
          paddingTop: 6,
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="HomeScreen"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={22}
              color={color}
            />
          ),
          tabBarLabel: "Trang chủ",
          title: "SMART PARKING",
        }}
      />

      <Tabs.Screen
        name="HistoryBooking"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <MaterialIcons
              name={focused ? "access-time-filled" : "access-time"}
              size={22}
              color={color}
            />
          ),
          title: "LỊCH SỬ",
          tabBarLabel: "Lịch sử",
        }}
      />

      <Tabs.Screen
        name="QRScreen"
        options={{
          title: "MÃ QR",
          tabBarButton: (props) => {
            const { delayLongPress, style, ...rest } = props as any;
            return (
              <TouchableOpacity
                {...rest}
                delayLongPress={undefined}
                style={[
                  style,
                  { top: -20, justifyContent: "center", alignItems: "center" },
                ]}
                activeOpacity={0.9}
              >
                <View
                  style={{
                    width: 65,
                    height: 65,
                    borderRadius: 999,
                    backgroundColor: AppColor.PRIMARY,
                    justifyContent: "center",
                    alignItems: "center",
                    elevation: 6,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  <Ionicons name="qr-code" size={32} color="#fff" />
                </View>
              </TouchableOpacity>
            );
          },
        }}
      />

      <Tabs.Screen
        name="MapParking"
        options={{
          title: "BẢN ĐỒ BÃI",
          tabBarLabel: "Bản đồ",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "map" : "map-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="SettingScreen"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={22} color={color} />
          ),
          title: "TÀI KHOẢN",
          tabBarLabel: "Tài khoản",
        }}
      />
    </Tabs>
  );
}
