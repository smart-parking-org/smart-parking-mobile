import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  StatusBar,
  Animated,
} from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  getVehicles,
  removeVehicle,
  setPrimaryVehicle,
  createVehicle,
  updateVehicle,
  resubmitVehicle,
  type VehicleType,
} from "@/lib/api/vehicles";
import { getProfile } from "@/lib/api/auth";
import { AppColor } from "@/lib/utils/color";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "@/app/components/vehicle/EmtyState";
import { SearchBar } from "@/app/components/vehicle/SearchBar";
import { FilterChips } from "@/app/components/vehicle/FilterChips";
import { ScreenHeader } from "@/app/components/vehicle/ScreenHeader";
import { NoResultState } from "@/app/components/vehicle/NoResultState";
import { VehicleList } from "@/app/components/vehicle/VehicleList";
import { AddVehicleButton } from "@/app/components/vehicle/AddVehicleButton";
import { DeleteVehicleModal } from "@/app/components/vehicle/DeleteVehicleModal";
import {
  VehicleFormModal,
  VEHICLE_TYPES,
} from "@/app/components/vehicle/VehicleFormModal";
import { SuccessToast } from "@/app/components/vehicle/SuccessToast";
import { VehicleActionModal } from "@/app/components/vehicle/VehicleActionModal"; // Thêm import
import type { Option } from "@/app/components/ui/Select";
import { Vehicle } from "@/app/components/vehicle/VehicleCard";

export default function MyVehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"compact" | "full">("compact");

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  // Thêm state cho action modal
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const actionSlideAnim = useRef(new Animated.Value(500)).current;

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [vehicleType, setVehicleType] = useState<Option | null>(null);
  const [licensePlate, setLicensePlate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<number>(0);
  // Lưu dữ liệu ban đầu để so sánh
  const [originalVehicleData, setOriginalVehicleData] = useState<{
    license_plate: string;
    vehicle_type: VehicleType;
  } | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const formSlideAnim = useRef(new Animated.Value(600)).current;

  // ... existing loadUserAndVehicles, useFocusEffect, filteredVehicles, primaryVehicle, useEffect ...

  const loadUserAndVehicles = async () => {
    try {
      const user = await getProfile();
      setUserId(user.id);
      const response = await getVehicles(user.id);
      setVehicles(response.data ?? []);
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.message || "Không thể tải danh sách phương tiện"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserAndVehicles();
    }, [])
  );

  const filteredVehicles = useMemo(() => {
    let result = [...vehicles];

    if (selectedFilter !== "all") {
      result = result.filter((v) => v.vehicle_type === selectedFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((v) =>
        v.license_plate.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return a.license_plate.localeCompare(b.license_plate);
    });

    return result;
  }, [vehicles, selectedFilter, searchQuery]);

  const primaryVehicle = useMemo(
    () => vehicles.find((v) => v.is_primary),
    [vehicles]
  );

  // ... existing showSuccess, openAddForm, openEditForm, closeFormModal, handleSubmitForm ...

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setSuccessMessage(null));
  };

  const openAddForm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsEditMode(false);
    setEditingVehicleId(null);
    setLicensePlate("");
    setVehicleType(null);
    setFormModalVisible(true);
    Animated.spring(formSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  };

  const openEditForm = (vehicle: Vehicle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditMode(true);
    setEditingVehicleId(vehicle.id);
    setLicensePlate(vehicle.license_plate);
    const option = VEHICLE_TYPES.find((t) => t.value === vehicle.vehicle_type);
    setVehicleType(option ?? null);
    // Lưu dữ liệu ban đầu để so sánh
    setOriginalVehicleData({
      license_plate: vehicle.license_plate,
      vehicle_type: vehicle.vehicle_type,
    });
    setFormModalVisible(true);
    Animated.spring(formSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  };

  const closeFormModal = () => {
    Animated.timing(formSlideAnim, {
      toValue: 600,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setFormModalVisible(false);
      setIsEditMode(false);
      setEditingVehicleId(null);
      setLicensePlate("");
      setVehicleType(null);
      setOriginalVehicleData(null);
    });
  };

  const handleSubmitForm = async () => {
    if (!licensePlate.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập biển số");
      return;
    }
    if (!vehicleType) {
      Alert.alert("Lỗi", "Vui lòng chọn Loại phương tiện");
      return;
    }

    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (isEditMode && editingVehicleId) {
        const newLicensePlate = licensePlate.trim();
        const newVehicleType = vehicleType.value as VehicleType;
        
        // Kiểm tra xem dữ liệu có thay đổi không
        const hasChanged =
          !originalVehicleData ||
          originalVehicleData.license_plate !== newLicensePlate ||
          originalVehicleData.vehicle_type !== newVehicleType;

        await updateVehicle(editingVehicleId, {
          license_plate: newLicensePlate,
          vehicle_type: newVehicleType,
        });

        // Chỉ gọi resubmit nếu dữ liệu thay đổi
        if (hasChanged) {
          await resubmitVehicle(editingVehicleId);
          showSuccess("Đã cập nhật - vui lòng chờ admin duyệt lại");
        } else {
          showSuccess("Đã cập nhật phương tiện");
        }
      } else {
        await createVehicle({
          user_id: userId,
          license_plate: licensePlate,
          vehicle_type: vehicleType.value as VehicleType,
        });
        showSuccess("Đã gửi yêu cầu duyệt phương tiện mới");
      }
      closeFormModal();
      await loadUserAndVehicles();
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể lưu phương tiện");
    } finally {
      setSubmitting(false);
    }
  };

  // Thêm các hàm mới cho action modal
  const openActionModal = (vehicle: Vehicle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVehicle(vehicle);
    setActionModalVisible(true);
    Animated.spring(actionSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  };

  const closeActionModal = () => {
    Animated.timing(actionSlideAnim, {
      toValue: 500,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setActionModalVisible(false);
      setSelectedVehicle(null);
    });
  };

  const handleActionEdit = () => {
    if (selectedVehicle) {
      closeActionModal();
      setTimeout(() => {
        openEditForm(selectedVehicle);
      }, 300);
    }
  };

  const handleActionSetDefault = () => {
    if (selectedVehicle) {
      closeActionModal();
      setTimeout(() => {
        setDefault(selectedVehicle);
      }, 300);
    }
  };

  const handleActionDelete = () => {
    if (selectedVehicle) {
      closeActionModal();
      setTimeout(() => {
        confirmDelete(selectedVehicle);
      }, 300);
    }
  };

  const setDefault = async (vehicle: Vehicle) => {
    if (vehicle.status !== "approved") {
      Alert.alert(
        "Chưa được duyệt",
        "Phương tiện cần được admin duyệt trước khi đặt làm mặc định."
      );
      return;
    }
    if (vehicle.is_primary) return;
    try {
      setSettingDefaultId(vehicle.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await setPrimaryVehicle(vehicle.id);
      await loadUserAndVehicles();
      showSuccess("Đã đặt làm phương tiện mặc định");
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể đặt mặc định");
    } finally {
      setSettingDefaultId(null);
    }
  };

  const confirmDelete = (vehicle: Vehicle) => {
    if (vehicle.is_primary) {
      Alert.alert(
        "Không thể xóa",
        "Vui lòng chọn phương tiện khác làm mặc định trước khi xóa phương tiện này."
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVehicleToDelete(vehicle);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;
    try {
      setDeletingId(vehicleToDelete.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await removeVehicle(vehicleToDelete.id);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleToDelete.id));
      setDeleteModalVisible(false);
      setVehicleToDelete(null);
      showSuccess("Đã xóa phương tiện");
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể xóa phương tiện");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <>
        <StatusBar
          barStyle="light-content"
          backgroundColor={AppColor.PRIMARY}
        />
        <SafeAreaView
          style={{ flex: 1, backgroundColor: "#F9FAFB" }}
          edges={["top"]}
        >
          <Stack.Screen
            options={{
              headerShown: true,
              title: "Phương tiện của tôi",
              headerTitleAlign: "center",
              headerStyle: { backgroundColor: AppColor.PRIMARY },
              headerShadowVisible: false,
              headerTitleStyle: {
                fontWeight: "600",
                fontSize: 17,
                color: "#fff",
              },
              headerTintColor: "#fff",
            }}
          />
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={AppColor.PRIMARY} />
            <Text className="mt-4 text-gray-500">Đang tải...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "QUẢN LÝ PHƯƠNG TIỆN",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: AppColor.PRIMARY },
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: "800", fontSize: 16, color: "#fff" },
        }}
      />

      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#F9FAFB" }}
        edges={["bottom"]}
      >
        <SuccessToast message={successMessage} fadeAnim={fadeAnim} />

        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <FilterChips selected={selectedFilter} onSelect={setSelectedFilter} />
        <ScreenHeader
          total={vehicles.length}
          filtered={filteredVehicles.length}
          primary={primaryVehicle}
        />

        {vehicles.length === 0 ? (
          <EmptyState onAdd={openAddForm} />
        ) : filteredVehicles.length === 0 ? (
          <NoResultState
            onReset={() => {
              setSearchQuery("");
              setSelectedFilter("all");
            }}
          />
        ) : (
          <VehicleList
            vehicles={vehicles}
            filteredVehicles={filteredVehicles}
            deletingId={deletingId}
            settingDefaultId={settingDefaultId}
            onSetDefault={setDefault}
            onEdit={openEditForm}
            onDelete={confirmDelete}
            onOpenActions={openActionModal} // Thêm prop mới
          />
        )}

        {vehicles.length > 0 && <AddVehicleButton onPress={openAddForm} />}

        {/* Action Modal */}
        <VehicleActionModal
          visible={actionModalVisible}
          vehicle={selectedVehicle}
          onClose={closeActionModal}
          onEdit={handleActionEdit}
          onSetDefault={handleActionSetDefault}
          onDelete={handleActionDelete}
          slideAnim={actionSlideAnim}
        />

        <VehicleFormModal
          visible={formModalVisible}
          isEditMode={isEditMode}
          licensePlate={licensePlate}
          vehicleType={vehicleType}
          submitting={submitting}
          formSlideAnim={formSlideAnim}
          onChangeLicense={setLicensePlate}
          onChangeType={setVehicleType}
          onSubmit={handleSubmitForm}
          onClose={closeFormModal}
        />

        <DeleteVehicleModal
          visible={deleteModalVisible}
          vehicle={vehicleToDelete}
          deletingId={deletingId}
          onCancel={() => {
            setDeleteModalVisible(false);
            setVehicleToDelete(null);
          }}
          onConfirm={handleDelete}
        />
      </SafeAreaView>
    </>
  );
}
