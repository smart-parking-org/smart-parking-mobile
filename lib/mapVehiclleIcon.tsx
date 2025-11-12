import { VehicleType } from "@/lib/api/vehicles";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

export const mapVehicleIcon = (type: VehicleType) => {
  const icons = {
    motorbike: (color: string, size: number) => (
      <MaterialIcons name="two-wheeler" size={size} color={color} />
    ),
    car_4_seat: (color: string, size: number) => (
      <MaterialCommunityIcons name="car-side" size={size} color={color} />
    ),
    car_7_seat: (color: string, size: number) => (
      <MaterialCommunityIcons name="car-estate" size={size} color={color} />
    ),
    light_truck: (color: string, size: number) => (
      <MaterialCommunityIcons name="truck" size={size} color={color} />
    ),
  };

  return icons[type];
};
