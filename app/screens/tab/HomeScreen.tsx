import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Carousel from "react-native-reanimated-carousel";
import { router } from "expo-router";
import { useAuthGuard } from "@/lib/hook/useAuthGuard";
import { LinearGradient } from "expo-linear-gradient";
import { getGreeting } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getProfile } from "@/lib/api/auth";
import { AppColor } from "@/lib/utils/color";
export default function HomeScreen() {
  useAuthGuard();
  const windowWidth = Dimensions.get("screen").width;
  const [user, setUser] = useState<any | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const user = await getProfile();
        setUser(user);
      } catch (e: any) {
        console.log("ME ERROR:", e?.response?.data || e?.message);
      }
    })();
  }, []);

  const list_offers = [
    {
      id: 1,
      title: "1",
      image: require("@/assets/images/banner.png"),
    },
    {
      id: 2,
      title: "2",
      image: require("@/assets/images/banner.png"),
    },
    {
      id: 3,
      title: "3",
      image: require("@/assets/images/banner.png"),
    },
  ];
  const { text, icon } = getGreeting();

  return (
    <ScrollView
      className="flex-1 bg-[#F5F6F8]"
      contentContainerClassName="pt-4 pb-8 px-4 grid gap-4"
    >
      <View className="relative rounded-2xl overflow-hidden shadow-lg shadow-black/10">
        <Carousel
          data={list_offers}
          width={windowWidth}
          height={170}
          loop
          autoPlay
          pagingEnabled
          scrollAnimationDuration={1200}
          renderItem={({ item }) => (
            <View className="w-full h-full">
              <Image
                source={item.image}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          )}
        />

        <LinearGradient
          colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.3)"]}
          className="absolute inset-x-0 bottom-0 h-full"
          pointerEvents="none"
        />

        {/* Weather badge */}
        <View className="absolute right-3 top-3 bg-white/90 rounded-full px-2.5 py-1 flex-row items-center shadow-sm">
          <Ionicons name="partly-sunny-outline" size={16} color="#f59e0b" />
          <Text className="ml-1 font-semibold text-neutral-700">28°C</Text>
        </View>

        {/* Greeting */}
        <View className="absolute left-3 bottom-3 w-full">
          <Text className="text-white/90 text-xs">
            Chào {text} {icon},
          </Text>
          <Text className="text-white text-lg font-semibold">{user?.name}</Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <Card
          title="Đặt chỗ"
          subtitle="Giữ chỗ nhanh"
          icon={
            <Ionicons
              name="calendar-outline"
              size={20}
              color={AppColor.PRIMARY}
            />
          }
          onPress={() => router.push("/screens/tab/MapParking")}
        />

        <Card
          title="Phương tiện"
          subtitle="Xe của tôi"
          icon={
            <Ionicons
              name="car-sport-outline"
              size={20}
              color={AppColor.PRIMARY}
            />
          }
          onPress={() => router.push("/screens/Vehicles/MyVehiclesScreen")}
        />
      </View>

      <Text className="border-l-4 border-blue-600 pl-2">Tiện ích</Text>
      <View className="flex-row gap-4 justify-between flex-wrap">
        <Utility
          icon={<Ionicons name="ticket-outline" size={28} color="#fff" />}
          label="Vé tháng"
          onPress={() => router.push("/screens/tab/MapParking")}
        />
        <Utility
          icon={<Ionicons name="warning-outline" size={28} color="#fff" />}
          label="Vi phạm"
          onPress={() => router.push("/screens/tab/MapParking")}
        />
        <Utility
          icon={<Ionicons name="time-outline" size={28} color="#fff" />}
          label="Lịch sử"
          onPress={() => router.push("/screens/tab/MapParking")}
        />
        <Utility
          icon={
            <Ionicons name="notifications-outline" size={28} color="#fff" />
          }
          label="Thông báo"
          onPress={() => router.push("/screens/tab/MapParking")}
        />
        <Utility
          icon={<Ionicons name="help-outline" size={28} color="#fff" />}
          label="Hỗ trợ"
          onPress={() => router.push("/screens/tab/MapParking")}
        />
      </View>
    </ScrollView>
  );
}

function Utility({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-col gap-1 items-center justify-center max-w-20"
    >
      <LinearGradient
        colors={[AppColor.PRIMARY, AppColor.SECONDARY]} //
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="w-16 h-16 items-center justify-center"
        style={{ borderRadius: 9999 }}
      >
        {icon}
      </LinearGradient>

      <Text className="text-gray-700 text-sm text-center" numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const Card = ({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onPress: () => void;
}) => (
  <Pressable onPress={onPress} className="flex-1" hitSlop={6}>
    <View
      className="rounded-2xl px-3 py-4 flex-row items-center"
      style={{ backgroundColor: `${AppColor.PRIMARY}15` /* 9% opacity */ }}
    >
      {/* Icon circle đậm */}
      <View
        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: `${AppColor.PRIMARY}26` /* ~15% */ }}
      >
        {icon}
      </View>

      <View className="flex-1">
        <Text
          className="text-base font-semibold"
          style={{ color: AppColor.PRIMARY }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text className="text-xs text-neutral-600 mt-0.5" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color={AppColor.PRIMARY} />
    </View>
  </Pressable>
);
