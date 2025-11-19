import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
  Modal,
  Linking,
  AppState,
  Platform,
} from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ExpoLinking from "expo-linking";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AppColor } from "@/lib/utils/color";
import { getProfile } from "@/lib/api/auth";
import {
  getMyMonthlyPasses,
  createMonthlyPass,
  cancelMonthlyPass,
  createMonthlyPassPayment,
  type MonthlyPass,
  type CreateMonthlyPassRequest,
} from "@/lib/api/monthlyPass";
import { getVehicles, type Vehicle } from "@/lib/api/vehicles";
import { getParkingLots, type ParkingLot } from "@/lib/api/parking-lots";
import Select, { type Option } from "@/app/components/ui/Select";
import Field from "@/app/components/ui/Field";

export default function MonthlyPassScreen() {
  const [loading, setLoading] = useState(true);
  const [monthlyPasses, setMonthlyPasses] = useState<MonthlyPass[]>([]);
  const [userId, setUserId] = useState<number>(0);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingParkingLots, setLoadingParkingLots] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState<Option | null>(null);
  const [selectedParkingLot, setSelectedParkingLot] = useState<Option | null>(
    null
  );
  const [months, setMonths] = useState("1");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Detail modal
  const [selectedPass, setSelectedPass] = useState<MonthlyPass | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await getProfile();
      setUserId(user.id);
      const passes = await getMyMonthlyPasses(user.id);
      setMonthlyPasses(passes);
      const lots = await getParkingLots();
      setParkingLots(lots);
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể tải danh sách vé tháng");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log("📱 MonthlyPassScreen focused - loading data");
      loadData();
    }, [])
  );

  useEffect(() => {
    const handleDeepLink = async ({ url }: { url: string }) => {
      try {
        const parsed = ExpoLinking.parse(url);

        if (
          parsed.path === "payment/result" ||
          url.includes("payment/result")
        ) {
          const params = parsed.queryParams;
          const status = params?.status as string;
          const monthlyPassId = params?.monthly_pass_id as string;

          // Nếu thanh toán thành công cho monthly pass, refresh danh sách
          if (status === "PAID" && monthlyPassId) {
            console.log("✅ Monthly pass payment successful, refreshing...");
            // Delay một chút để đảm bảo backend đã cập nhật
            setTimeout(() => {
              loadData();
            }, 1000);
          }
        }
      } catch (error) {
        console.error("Error handling deep link in MonthlyPassScreen:", error);
      }
    };

    // Lắng nghe deep link
    const subscription = ExpoLinking.addEventListener("url", handleDeepLink);

    // Kiểm tra URL khi component mount
    ExpoLinking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Lắng nghe khi app quay lại foreground (sau khi thanh toán)
    const subscriptionAppState = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") {
          // Refresh khi app active (có thể user vừa quay lại từ VNPay)
          loadData();
        }
      }
    );

    return () => {
      subscription.remove();
      subscriptionAppState.remove();
    };
  }, []);

  const loadVehicles = async () => {
    if (!userId) return;
    try {
      setLoadingVehicles(true);
      const response = await getVehicles(userId);
      setVehicles(response.data || []);
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể tải danh sách phương tiện");
    } finally {
      setLoadingVehicles(false);
    }
  };

  const loadParkingLots = async () => {
    try {
      setLoadingParkingLots(true);
      const lots = await getParkingLots();
      setParkingLots(lots);
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể tải danh sách bãi đỗ");
    } finally {
      setLoadingParkingLots(false);
    }
  };

  useEffect(() => {
    if (showForm && userId) {
      loadVehicles();
      if (parkingLots.length === 0) {
        loadParkingLots();
      }
    }
  }, [showForm, userId]);

  const handleOpenForm = () => {
    if (!userId) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập lại");
      return;
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedVehicle(null);
    setSelectedParkingLot(null);
    setMonths("1");
    setStartDate(null);
    setShowDatePicker(false);
  };

  const handleSubmit = async () => {
    if (!selectedVehicle || !selectedParkingLot) {
      Alert.alert("Lỗi", "Vui lòng chọn đầy đủ thông tin");
      return;
    }

    if (!userId) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập lại");
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateMonthlyPassRequest = {
        user_id: userId,
        vehicle_id: Number(selectedVehicle.value),
        parking_lot_id: Number(selectedParkingLot.value),
        months: Number(months) || 1,
      };

      if (startDate) {
        // Format date to YYYY-MM-DD
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, "0");
        const day = String(startDate.getDate()).padStart(2, "0");
        payload.start_date = `${year}-${month}-${day}`;
      }

      const result = await createMonthlyPass(payload);

      Alert.alert(
        "Thành công",
        `Vé tháng đã được tạo!\nSố tiền: ${formatCurrency(
          result.amount
        )}\n\nBạn có muốn thanh toán ngay?`,
        [
          {
            text: "Để sau",
            style: "cancel",
            onPress: () => {
              handleCloseForm();
              loadData();
            },
          },
          {
            text: "Thanh toán",
            onPress: async () => {
              try {
                const canOpen = await Linking.canOpenURL(result.payUrl);
                if (canOpen) {
                  await Linking.openURL(result.payUrl);
                  // Sau khi mở URL, app sẽ tự động refresh khi nhận deep link
                } else {
                  Alert.alert("Lỗi", "Không thể mở link thanh toán");
                }
              } catch (err) {
                Alert.alert("Lỗi", "Không thể mở link thanh toán");
              }
              handleCloseForm();
            },
          },
        ]
      );
    } catch (error: any) {
      // ✅ Hiển thị thông báo lỗi chi tiết hơn
      const errorMessage = error.message || "Không thể tạo vé tháng";
      Alert.alert("Lỗi đăng ký", errorMessage, [
        {
          text: "Xem vé tháng hiện tại",
          onPress: () => {
            handleCloseForm();
            loadData(); // Refresh để hiển thị vé tháng đang có
          },
        },
        {
          text: "Đóng",
          style: "cancel",
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async (pass: MonthlyPass) => {
    if (pass.status !== "PENDING") {
      Alert.alert("Lỗi", "Chỉ có thể thanh toán vé tháng đang chờ thanh toán");
      return;
    }

    try {
      Alert.alert(
        "Xác nhận",
        `Bạn có muốn thanh toán vé tháng này?\nSố tiền: ${formatCurrency(
          pass.amount
        )}`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Thanh toán",
            onPress: async () => {
              try {
                const result = await createMonthlyPassPayment(pass.id);
                const canOpen = await Linking.canOpenURL(result.payUrl);
                if (canOpen) {
                  await Linking.openURL(result.payUrl);
                } else {
                  Alert.alert("Lỗi", "Không thể mở link thanh toán");
                }
              } catch (error: any) {
                Alert.alert(
                  "Lỗi",
                  error.message || "Không thể tạo link thanh toán"
                );
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể tạo link thanh toán");
    }
  };

  const handleCancel = async (pass: MonthlyPass) => {
    if (pass.status !== "PENDING") {
      Alert.alert("Lỗi", "Chỉ có thể hủy vé tháng đang chờ thanh toán");
      return;
    }

    Alert.alert("Xác nhận", "Bạn có chắc muốn hủy vé tháng này?", [
      { text: "Không", style: "cancel" },
      {
        text: "Có",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelMonthlyPass(pass.id);
            Alert.alert("Thành công", "Đã hủy vé tháng");
            loadData();
          } catch (error: any) {
            Alert.alert("Lỗi", error.message || "Không thể hủy vé tháng");
          }
        },
      },
    ]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { label: string; color: string; bgColor: string }
    > = {
      PENDING: {
        label: "Chờ thanh toán",
        color: "#f59e0b",
        bgColor: "#fef3c7",
      },
      ACTIVE: { label: "Đang sử dụng", color: "#10b981", bgColor: "#d1fae5" },
      CANCELLED: { label: "Đã hủy", color: "#6b7280", bgColor: "#f3f4f6" },
      EXPIRED: { label: "Hết hạn", color: "#6b7280", bgColor: "#f3f4f6" },
      FAILED: {
        label: "Thanh toán thất bại",
        color: "#ef4444",
        bgColor: "#fee2e2",
      },
    };

    const s = config[status] || {
      label: status,
      color: "#6b7280",
      bgColor: "#f3f4f6",
    };

    return (
      <View
        className="px-3 py-1 rounded-full"
        style={{ backgroundColor: s.bgColor }}
      >
        <Text className="text-xs font-semibold" style={{ color: s.color }}>
          {s.label}
        </Text>
      </View>
    );
  };

  const getVehicleTypeName = (type: string) => {
    const names: Record<string, string> = {
      motorbike: "Xe máy",
      car_4_seat: "Ô tô 4 chỗ",
      car_7_seat: "Ô tô 7 chỗ",
      light_truck: "Xe tải nhẹ",
    };
    return names[type] || type;
  };

  const vehicleOptions: Option[] = vehicles.map((v) => ({
    label: `${v.license_plate} (${getVehicleTypeName(v.vehicle_type)})`,
    value: v.id.toString(),
  }));

  const parkingLotOptions: Option[] = parkingLots.map((lot) => ({
    label: lot.name,
    value: lot.id.toString(),
  }));

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "VÉ THÁNG",
            headerTitleAlign: "center",
            headerStyle: { backgroundColor: AppColor.PRIMARY },
            headerShadowVisible: false,
            headerTitleStyle: {
              fontWeight: "800",
              fontSize: 16,
              color: "#fff",
            },
            headerTintColor: "#fff",
            headerBackVisible: true,
          }}
        />
        <SafeAreaView
          edges={["bottom"]}
          style={{ flex: 1, backgroundColor: "#F9FAFB" }}
        >
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
          title: "VÉ THÁNG",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: AppColor.PRIMARY },
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: "800",
            fontSize: 16,
            color: "#fff",
          },
          headerTintColor: "#fff",
          headerBackVisible: true,
        }}
      />
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      >
        <ScrollView className="flex-1">
          <View className="px-4 pt-4 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="border-l-4 border-blue-600 pl-2 font-semibold text-base">
                Vé tháng của tôi
              </Text>
              <Pressable
                onPress={handleOpenForm}
                className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text className="text-white font-semibold ml-1">
                  Đăng ký mới
                </Text>
              </Pressable>
            </View>

            {monthlyPasses.length === 0 ? (
              <View className="bg-white rounded-xl p-8 items-center border border-gray-200 shadow-sm">
                <View className="bg-gray-100 p-6 rounded-full mb-4">
                  <Ionicons name="ticket-outline" size={48} color="#9ca3af" />
                </View>
                <Text className="text-gray-600 font-medium text-lg mb-2">
                  Chưa có vé tháng
                </Text>
                <Text className="text-gray-500 text-center text-sm">
                  Bạn chưa đăng ký vé tháng nào.{"\n"}
                  Nhấn Đăng ký mới để đăng ký ngay!
                </Text>
              </View>
            ) : (
              <View className="space-y-3">
                {monthlyPasses.map((pass) => (
                  <Pressable
                    key={pass.id}
                    onPress={() => {
                      setSelectedPass(pass);
                      setShowDetail(true);
                    }}
                    className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="font-semibold text-base mb-1">
                          {pass.vehicle_snapshot?.license_plate ||
                            `Vehicle #${pass.vehicle_id}`}
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          {parkingLots.find((l) => l.id === pass.parking_lot_id)
                            ?.name || `Bãi #${pass.parking_lot_id}`}
                        </Text>
                      </View>
                      {getStatusBadge(pass.status)}
                    </View>

                    <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <View>
                        <Text className="text-xs text-gray-500">Số tháng</Text>
                        <Text className="text-sm font-medium">
                          {pass.months} tháng
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-xs text-gray-500">Số tiền</Text>
                        <Text className="text-sm font-semibold text-green-600">
                          {formatCurrency(pass.amount)}
                        </Text>
                      </View>
                    </View>

                    {pass.status === "PENDING" && (
                      <>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            handlePayment(pass);
                          }}
                          className="mt-3 py-2 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <Text className="text-blue-600 text-sm text-center font-medium">
                            Thanh toán ngay
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            handleCancel(pass);
                          }}
                          className="mt-2 py-2"
                        >
                          <Text className="text-red-600 text-sm text-center font-medium">
                            Hủy vé tháng
                          </Text>
                        </Pressable>
                      </>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Form Modal */}
        <Modal
          visible={showForm}
          animationType="slide"
          transparent
          onRequestClose={handleCloseForm}
        >
          <View className="flex-1 bg-black/50">
            <Pressable className="flex-1" onPress={handleCloseForm} />
            <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold">Đăng ký vé tháng</Text>
                <Pressable onPress={handleCloseForm}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Select
                  label="Phương tiện *"
                  value={selectedVehicle}
                  options={vehicleOptions}
                  onSelect={setSelectedVehicle}
                  disabled={loadingVehicles}
                />

                <Select
                  label="Bãi đỗ xe *"
                  value={selectedParkingLot}
                  options={parkingLotOptions}
                  onSelect={setSelectedParkingLot}
                  disabled={loadingParkingLots}
                />

                <Field
                  label="Số tháng"
                  value={months}
                  onChangeText={setMonths}
                  keyboardType="numeric"
                  placeholder="1"
                />

                {/* Date Picker */}
                <View className="mb-3">
                  <Text className="text-gray-600 mb-1">
                    Ngày bắt đầu (tùy chọn)
                  </Text>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    className="h-12 rounded-2xl px-4 border border-gray-300 flex-row items-center justify-between"
                  >
                    <Text
                      className={startDate ? "text-gray-800" : "text-gray-400"}
                    >
                      {startDate
                        ? startDate.toLocaleDateString("vi-VN")
                        : "Chọn ngày"}
                    </Text>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#9ca3af"
                    />
                  </Pressable>
                </View>

                {/* Date Picker Modal */}
                {showDatePicker && Platform.OS === "ios" && (
                  <Modal
                    visible={showDatePicker}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowDatePicker(false)}
                  >
                    <View className="flex-1 bg-black/50 justify-end">
                      <Pressable
                        className="flex-1"
                        onPress={() => setShowDatePicker(false)}
                      />
                      <View className="bg-white rounded-t-3xl p-4">
                        <View className="flex-row items-center justify-between mb-4">
                          <Text className="text-lg font-semibold">
                            Chọn ngày bắt đầu
                          </Text>
                          <Pressable onPress={() => setShowDatePicker(false)}>
                            <Text className="text-blue-600 font-semibold">
                              Xong
                            </Text>
                          </Pressable>
                        </View>
                        <DateTimePicker
                          value={startDate || new Date()}
                          mode="date"
                          display="spinner"
                          minimumDate={new Date()}
                          onChange={(event, selectedDate) => {
                            if (event.type === "set" && selectedDate) {
                              setStartDate(selectedDate);
                            }
                          }}
                          style={{ height: 200 }}
                        />
                      </View>
                    </View>
                  </Modal>
                )}

                {showDatePicker && Platform.OS === "android" && (
                  <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (event.type === "set" && selectedDate) {
                        setStartDate(selectedDate);
                      }
                    }}
                  />
                )}

                <Pressable
                  onPress={handleSubmit}
                  disabled={
                    submitting || !selectedVehicle || !selectedParkingLot
                  }
                  className={`mt-4 py-4 rounded-xl ${
                    submitting || !selectedVehicle || !selectedParkingLot
                      ? "bg-gray-300"
                      : "bg-blue-600"
                  }`}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-center font-semibold text-base">
                      Đăng ký
                    </Text>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Detail Modal */}
        <Modal
          visible={showDetail}
          animationType="slide"
          transparent
          onRequestClose={() => setShowDetail(false)}
        >
          <View className="flex-1 bg-black/50">
            <Pressable
              className="flex-1"
              onPress={() => setShowDetail(false)}
            />
            <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold">Chi tiết vé tháng</Text>
                <Pressable onPress={() => setShowDetail(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </Pressable>
              </View>

              {selectedPass && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="space-y-6">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-600">Trạng thái</Text>
                      {getStatusBadge(selectedPass.status)}
                    </View>

                    <View>
                      <Text className="text-gray-600 text-sm mt-4">
                        Phương tiện
                      </Text>
                      <Text className="font-medium mb-1">
                        {selectedPass.vehicle_snapshot?.license_plate ||
                          `Vehicle #${selectedPass.vehicle_id}`}
                      </Text>
                      {selectedPass.vehicle_snapshot && (
                        <Text className="text-gray-500 text-sm">
                          {getVehicleTypeName(
                            selectedPass.vehicle_snapshot.vehicle_type
                          )}
                        </Text>
                      )}
                    </View>

                    <View>
                      <Text className="text-gray-600 text-sm mt-4">
                        Bãi đỗ xe
                      </Text>
                      <Text className="font-medium">
                        {parkingLots.find(
                          (l) => l.id === selectedPass.parking_lot_id
                        )?.name || `Bãi #${selectedPass.parking_lot_id}`}
                      </Text>
                    </View>

                    <View className="flex-row justify-between">
                      <View>
                        <Text className="text-gray-600 text-sm mt-4">
                          Số tháng
                        </Text>
                        <Text className="font-medium">
                          {selectedPass.months} tháng
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-gray-600 text-sm mt-4">
                          Số tiền
                        </Text>
                        <Text className="font-semibold text-green-600">
                          {formatCurrency(selectedPass.amount)}
                        </Text>
                      </View>
                    </View>

                    <View>
                      <Text className="text-gray-600 text-sm mt-4">
                        Ngày bắt đầu
                      </Text>
                      <Text className="font-medium">
                        {selectedPass.start_date
                          ? new Date(
                              selectedPass.start_date
                            ).toLocaleDateString("vi-VN")
                          : "-"}
                      </Text>
                    </View>

                    <View>
                      <Text className="text-gray-600 text-sm mt-4">
                        Ngày kết thúc
                      </Text>
                      <Text className="font-medium">
                        {selectedPass.end_date
                          ? new Date(selectedPass.end_date).toLocaleDateString(
                              "vi-VN"
                            )
                          : "-"}
                      </Text>
                    </View>

                    <View>
                      <Text className="text-gray-600 text-sm mt-4">
                        Mã đơn hàng
                      </Text>
                      <Text className="font-mono text-sm mb-4">
                        {selectedPass.order_id}
                      </Text>
                    </View>

                    {selectedPass.status === "PENDING" && (
                      <>
                        <Pressable
                          onPress={() => {
                            setShowDetail(false);
                            handlePayment(selectedPass);
                          }}
                          className="mt-4 py-3 bg-blue-600 rounded-xl"
                        >
                          <Text className="text-white text-center font-semibold">
                            Thanh toán ngay
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setShowDetail(false);
                            handleCancel(selectedPass);
                          }}
                          className="mt-3 py-3 bg-red-50 rounded-xl border border-red-200"
                        >
                          <Text className="text-red-600 text-center font-semibold">
                            Hủy vé tháng
                          </Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}
