import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router"; // Thêm useFocusEffect
import VehicleSwipeRow, {
  Vehicle,
} from "@/app/components/vehicle/VehicleSwipeRow";
import {
  getVehicles,
  removeVehicle,
  setPrimaryVehicle,
} from "@/lib/api/vehicles";
import { getProfile } from "@/lib/api/auth";

export default function MyVehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Load user và vehicles
  const loadUserAndVehicles = async () => {
    try {
      const user = await getProfile();
      setUserId(user.id);

      const response = await getVehicles(user.id);
      setVehicles(response.data);
    } catch (error: any) {
      console.error("Lỗi tải phương tiện:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể tải danh sách phương tiện"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Sử dụng useFocusEffect để reload khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      // Chỉ load nếu đã có userId (không load lần đầu khi mount)
      if (userId) {
        loadUserAndVehicles();
      } else {
        // Lần đầu tiên mới load
        loadUserAndVehicles();
      }
    }, [userId])
  );

  // useEffect ban đầu để load lần đầu
  useEffect(() => {
    // Không cần load ở đây vì useFocusEffect sẽ handle
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadUserAndVehicles();
  };

  const def = useMemo(() => vehicles.find((v) => v.is_primary), [vehicles]);
  const others = useMemo(
    () => vehicles.filter((v) => !v.is_primary),
    [vehicles]
  );

  // Đặt mặc định
  const setDefault = async (id: number) => {
    try {
      await setPrimaryVehicle(id);
      await loadUserAndVehicles(); // Reload để cập nhật
      Alert.alert("Thành công", "Đã đặt làm phương tiện mặc định");
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể đặt phương tiện mặc định");
    }
  };

  // Xóa phương tiện
  const confirmDelete = async (v: Vehicle) => {
    if (v.is_primary) {
      Alert.alert(
        "Không thể xóa",
        "Đây là phương tiện mặc định. Hãy đặt mặc định phương tiện khác trước khi xóa."
      );
      return;
    }
    Alert.alert("Xóa phương tiện?", `${v.license_plate}`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await removeVehicle(v.id);
            setVehicles((prev) => prev.filter((x) => x.id !== v.id));
          } catch (e: any) {
            Alert.alert("Lỗi", e.message || "Không thể xóa phương tiện");
          }
        },
      },
    ]);
  };

  // Sửa phương tiện
  const editVehicle = (v: Vehicle) => {
    router.push({
      pathname: "/screens/Vehicles/AddVehicleScreen",
      params: { id: String(v.id) },
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-2 pb-3 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={22} color="#000000" />
        </TouchableOpacity>
        <Text className="text-black font-semibold">PHƯƠNG TIỆN</Text>
        <View className="h-10 w-10" />
      </View>

      <FlatList
        data={[{ key: "default" }, { key: "list" }]}
        keyExtractor={(i) => i.key}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => {
          if (item.key === "default") {
            return (
              <View className="mb-5">
                <Text className="text-[12px] text-gray-500 mb-2">
                  PHƯƠNG TIỆN MẶC ĐỊNH
                </Text>
                {def ? (
                  <VehicleSwipeRow
                    v={def}
                    onPress={() => setDefault(def.id)}
                    onEdit={editVehicle}
                    onDelete={confirmDelete}
                    canDelete={!def.is_primary}
                  />
                ) : (
                  <View className="px-4 py-3 rounded-2xl border border-dashed border-gray-300 bg-white">
                    <Text className="text-gray-500">
                      Chưa có phương tiện mặc định
                    </Text>
                  </View>
                )}
              </View>
            );
          }

          return (
            <View>
              <Text className="text-[12px] text-gray-500 mb-2">
                TẤT CẢ PHƯƠNG TIỆN ({vehicles.length})
              </Text>
              {others.map((v) => (
                <VehicleSwipeRow
                  key={v.id}
                  v={v}
                  onPress={() => setDefault(v.id)}
                  onEdit={editVehicle}
                  onDelete={confirmDelete}
                />
              ))}
            </View>
          );
        }}
      />

      <View className="px-4 pb-5">
        <TouchableOpacity
          onPress={() => router.push("/screens/Vehicles/AddVehicleScreen")}
          className="h-12 rounded-2xl bg-blue-600 items-center justify-center"
        >
          <Text className="text-white font-semibold">THÊM PHƯƠNG TIỆN</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
