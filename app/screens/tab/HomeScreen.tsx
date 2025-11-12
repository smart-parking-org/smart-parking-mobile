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
import { getMyActiveReservations } from "@/lib/api/booking";
export default function HomeScreen() {
  useAuthGuard();
  const [activeReservationsCount, setActiveReservationsCount] = useState(0);

  const windowWidth = Dimensions.get("screen").width;
  const [user, setUser] = useState<any | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const user = await getProfile();
        setUser(user);
        const reservations = await getMyActiveReservations(user.id);
        setActiveReservationsCount(reservations.length);
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
          title="Đặt chỗ đang hoạt động"
          subtitle={
            activeReservationsCount > 0
              ? `${activeReservationsCount} đặt chỗ đang sử dụng`
              : "Chưa có đặt chỗ"
          }
          icon={
            <Ionicons
              name="calendar-outline"
              size={20}
              color={AppColor.PRIMARY}
            />
          }
          onPress={() => router.push("/screens/tab/QRScreen")}
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

      <Text className="border-l-4 border-blue-600 pl-2 font-semibold">
        Tiện ích
      </Text>
      <View className="flex-row gap-4 justify-evenly flex-wrap">
        <Utility
          icon={<Ionicons name="ticket-outline" size={28} color="#fff" />}
          label="Vé tháng"
          onPress={() => router.push("/screens/MonthlyPassScreen")}
        />
        <Utility
          icon={<Ionicons name="time-outline" size={28} color="#fff" />}
          label="Hoạt động"
          onPress={() => router.push("/screens/tab/HistoryBooking")}
        />
        <Utility
          icon={
            <Ionicons name="notifications-outline" size={28} color="#fff" />
          }
          label="Thông báo"
          onPress={() => router.push("/screens/NotificationScreen")}
        />
        <Utility
          icon={<Ionicons name="help-outline" size={28} color="#fff" />}
          label="Hỗ trợ"
          onPress={() => {}}
        />
      </View>

      {/* Dịch vụ nổi bật - Service Highlights */}
      <View className="mt-4">
        <Text className="border-l-4 border-blue-600 pl-2 mb-3 font-semibold">
          Dịch vụ của chúng tôi
        </Text>
        <View className="space-y-3">
          <View className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex-row items-center">
            <View className="bg-blue-100 p-3 rounded-xl mr-4">
              <Ionicons name="map" size={24} color={AppColor.PRIMARY} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-800 mb-1">
                Bản đồ bãi đỗ thông minh
              </Text>
              <Text className="text-xs text-gray-600">
                Xem vị trí và tình trạng bãi đỗ trực tiếp
              </Text>
            </View>
          </View>

          <View className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex-row items-center">
            <View className="bg-green-100 p-3 rounded-xl mr-4">
              <Ionicons name="qr-code" size={24} color="#22c55e" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-800 mb-1">
                Check-in bằng QR Code
              </Text>
              <Text className="text-xs text-gray-600">
                Quét mã QR để vào bãi đỗ nhanh chóng
              </Text>
            </View>
          </View>

          <View className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex-row items-center">
            <View className="bg-purple-100 p-3 rounded-xl mr-4">
              <Ionicons name="card" size={24} color="#a855f7" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-800 mb-1">
                Thanh toán đa dạng
              </Text>
              <Text className="text-xs text-gray-600">
                Hỗ trợ nhiều phương thức thanh toán
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Lợi ích sử dụng - Benefits */}
      <View className="mt-4">
        <Text className="border-l-4 border-blue-600 pl-2 mb-3 font-semibold">
          Lợi ích khi sử dụng
        </Text>
        <View className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 min-w-[48%] flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text className="text-sm text-gray-700 ml-2">
                Tiết kiệm thời gian
              </Text>
            </View>
            <View className="flex-1 min-w-[48%] flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text className="text-sm text-gray-700 ml-2">
                An toàn bảo mật
              </Text>
            </View>
            <View className="flex-1 min-w-[48%] flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text className="text-sm text-gray-700 ml-2">
                Thanh toán nhanh
              </Text>
            </View>
            <View className="flex-1 min-w-[48%] flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text className="text-sm text-gray-700 ml-2">Hỗ trợ 24/7</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Liên hệ hỗ trợ - Support Contact */}
      <View className="mt-4">
        <View className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
          <View className="flex-row items-center mb-3">
            <View className="bg-blue-500 p-2 rounded-lg mr-3">
              <Ionicons name="headset" size={20} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-800">Cần hỗ trợ?</Text>
              <Text className="text-xs text-gray-600">
                Liên hệ với chúng tôi
              </Text>
            </View>
          </View>
          <View className="flex-row gap-3">
            <Pressable className="flex-1 bg-white rounded-lg p-3 border border-gray-200 items-center">
              <Ionicons name="call" size={20} color={AppColor.PRIMARY} />
              <Text className="text-xs text-gray-700 mt-1">Gọi điện</Text>
            </Pressable>
            <Pressable className="flex-1 bg-white rounded-lg p-3 border border-gray-200 items-center">
              <Ionicons name="chatbubble" size={20} color={AppColor.PRIMARY} />
              <Text className="text-xs text-gray-700 mt-1">Chat</Text>
            </Pressable>
            <Pressable className="flex-1 bg-white rounded-lg p-3 border border-gray-200 items-center">
              <Ionicons name="mail" size={20} color={AppColor.PRIMARY} />
              <Text className="text-xs text-gray-700 mt-1">Email</Text>
            </Pressable>
          </View>
        </View>
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
        colors={[AppColor.PRIMARY, AppColor.SECONDARY]}
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
