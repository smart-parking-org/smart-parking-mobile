import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  Dimensions,
  StyleSheet,
} from "react-native";
import {
  Ionicons,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import Carousel, { Pagination } from "react-native-reanimated-carousel";
import { router } from "expo-router";
import { useAuthGuard } from "@/lib/hook/useAuthGuard";
export default function HomeScreen() {
  useAuthGuard();
  const width = Dimensions.get("screen").width * 0.88;
  const list_offers = [
    {
      id: 1,
      title: "1",
      image: require("../../../assets/images/avatar.png"),
    },
    {
      id: 2,
      title: "2",
      image: require("../../../assets/images/avatar.png"),
    },
    {
      id: 3,
      title: "3",
      image: require("../../../assets/images/avatar.png"),
    },
  ];
  return (
    <ScrollView
      className="flex-1 bg-[#F5F6F8]"
      contentContainerClassName="py-10"
    >
      {/* Top row: logo + avatar */}
      <View className="px-4 pt-3 flex-row items-center justify-between">
        <Image
          source={require("../../../assets/logo.png")} // đổi path nếu cần
          resizeMode="contain"
          style={{ width: 50, height: 50 }}
        />
        <Pressable onPress={() => router.push("/screens/tab/ProfileScreen")}>
          <Image
            source={require("../../../assets/images/avatar.png")}
            style={{ width: 55, height: 55, borderRadius: 25 }}
          />
        </Pressable>
      </View>

      {/* Hero banner */}
      <View className="px-4 mt-3">
        <View className="relative rounded-2xl overflow-hidden">
          <Image
            source={require("../../../assets/images/car-parking.png")}
            style={{ width: "100%", height: 150 }}
            resizeMode="cover"
          />
          {/* weather */}
          <View className="absolute right-3 top-3 bg-white/90 rounded-full px-2.5 py-1 flex-row items-center">
            <Ionicons name="partly-sunny-outline" size={16} color="#f59e0b" />
            <Text className="ml-1 font-medium">28°C</Text>
          </View>
          {/* greeting */}
          <View className="absolute left-3 bottom-3">
            <Text className="text-white/90 text-xs">Chào buổi sáng,</Text>
            <Text className="text-white font-semibold">Nguyễn Phú Tài</Text>
          </View>
        </View>
      </View>

      {/* 2 info cards */}
      <View className="px-4 mt-3 flex-row gap-3">
        <InfoCard
          title="Xe của tôi"
          right={<MorePill />}
          icon={<MaterialCommunityIcons name="car" size={22} color="#2563eb" />}
          onPress={() => router.push("/screens/Vehicles/MyVehiclesScreen")}
        />
        <InfoCard
          title="Thời gian gửi xe"
          right={<Text className="text-gray-500">30 : 00 mins</Text>}
          icon={<Ionicons name="time-outline" size={20} color="#6b7280" />}
          onPress={() => router.push("/screens/tab/HistoryBooking")}
        />
      </View>

      {/* action chips */}
      <View className="px-4 mt-3 flex-row items-center">
        <Chip
          label="Đặt chỗ"
          color="#4F46E5"
          onPress={() => router.push("/screens/parking/ParkingLotsScreen")}
        />
        <View className="w-3" />
        <Chip
          label="Thanh toán"
          color="#FB923C"
          onPress={() => router.push("/screens/tab/ProfileScreen")}
        />
        <View className="w-3" />
        <Chip
          label="Thêm thời gian"
          color="#22C55E"
          onPress={() => router.push("/screens/parking/BikeSlotScreen")}
        />
      </View>

      {/* Parking charges */}
      <SectionTitle title="Phí gửi xe ( /giờ )" />
      <View className="px-4">
        <View className="bg-white rounded-2xl p-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Charge icon="bike" price="2.000đ" />
            <Charge icon="motorbike" price="10.000đ" />
            <Charge icon="car" price="50.000đ" />
            <Charge icon="car-sports" price="70.000đ" />
            <Charge icon="car-estate" price="100.000đ" />
          </ScrollView>
        </View>
      </View>

      {/* Offers & Updates */}
      <SectionTitle title="Ưu đãi & Cập nhật" />
      <View className="px-4">
        <View className="bg-white rounded-2xl p-3">
          {/*<Image
            source={require("../../../assets/images/avatar.png")}
            style={{ width: "100%", height: 150, borderRadius: 14 }}
            resizeMode="cover"
          /> */}
          <Carousel
            data={list_offers}
            width={width}
            height={width / 2.5}
            autoPlay={true}
            scrollAnimationDuration={2000}
            renderItem={({ item }) => (
              <View style={styles.CarouselItem}>
                <Image source={item.image} style={styles.img} />
              </View>
            )}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  CarouselItem: {
    flex: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  img: {
    width: "100%",
    height: 150,
    borderRadius: 25,
    resizeMode: "cover",
    padding: 6,
  },
});
/* ------- subcomponents ------- */

function SectionTitle({ title }: { title: string }) {
  return (
    <View className="px-4 mt-4 mb-2">
      <Text className="text-gray-700 font-semibold">{title}</Text>
    </View>
  );
}

function MorePill() {
  return (
    <View className="flex-row items-center">
      <Text className="text-gray-500 mr-1">More</Text>
      <Ionicons name="chevron-forward" size={14} color="#9ca3af" />
    </View>
  );
}

function InfoCard({
  title,
  right,
  icon,
  onPress,
}: {
  title: string;
  right?: React.ReactNode;
  icon: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1">
      <View className="bg-white rounded-2xl p-3">
        <View className="flex-row items-center justify-between">
          <View className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center">
            {icon}
          </View>
          {right}
        </View>
        <Text className="mt-2 text-gray-700 font-semibold">{title}</Text>
      </View>
    </Pressable>
  );
}

function Chip({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1">
      <View
        style={{ borderLeftColor: color }}
        className="bg-white rounded-xl py-5 items-center border-l-8"
      >
        <Text className="font-medium">{label}</Text>
      </View>
    </Pressable>
  );
}

function Charge({ icon, price }: { icon: any; price: string }) {
  return (
    <View className="mr-3 items-center">
      <View className="w-20 h-16 rounded-2xl bg-gray-100 items-center justify-center">
        <MaterialCommunityIcons name={icon} size={26} color="#374151" />
      </View>
      <Text className="text-gray-700 mt-1">{price}</Text>
    </View>
  );
}
