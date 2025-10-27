import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

type VehicleType = "car" | "bike";
type VehicleStore = {
  defaultType: VehicleType | null;
  setDefaultType: (t: VehicleType) => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useVehicleStore = create<VehicleStore>((set) => ({
  defaultType: null,
  setDefaultType: async (t) => {
    await AsyncStorage.setItem("default_vehicle_type", t);
    set({ defaultType: t });
  },
  hydrate: async () => {
    const t = (await AsyncStorage.getItem("default_vehicle_type")) as VehicleType | null;
    if (t) set({ defaultType: t });
  },
}));
