import { AppColor } from "@/lib/utils/color";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { Marker } from "react-native-maps";

type Coord = { latitude: number; longitude: number };

export default function PingMarker({
  coordinate,
  title,
  description,
  onPress,
}: {
  coordinate: Coord;
  title: string;
  description: string;
  onPress?: () => void;
}) {
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      onPress={onPress}
    >
      <View>
        <Ionicons name="pin-sharp" color={AppColor.DANGER} size={28} />
      </View>
    </Marker>
  );
}
