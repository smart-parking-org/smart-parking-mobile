// import React, { useState, useEffect } from "react";
// import {
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   Text,
//   TouchableOpacity,
//   View,
//   ActivityIndicator,
//   Alert,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Stack } from "expo-router";
// import Field from "@/app/components/ui/Field";
// import Select, { Option } from "@/app/components/ui/Select";
// import { router, useLocalSearchParams } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { getProfile } from "@/lib/api/auth";
// import {
//   getVehicle,
//   createVehicle,
//   updateVehicle,
//   resubmitVehicle,
//   type VehicleType,
// } from "@/lib/api/vehicles";
// import { AppColor } from "@/lib/utils/color";

// // Các loại xe theo backend
// const VEHICLE_TYPES: Option[] = [
//   { label: "Xe máy", value: "motorbike" },
//   { label: "Ô tô 4 chỗ", value: "car_4_seat" },
//   { label: "Ô tô 7 chỗ", value: "car_7_seat" },
//   { label: "Xe tải nhẹ", value: "light_truck" },
// ];

// export default function AddVehicleScreen() {
//   const params = useLocalSearchParams();
//   const isEdit = !!params.id;
//   const vehicleId = params.id ? parseInt(params.id as string) : null;

//   const [userId, setUserId] = useState<number>(0);
//   const [loadingUser, setLoadingUser] = useState(true);
//   const [vehicleType, setVehicleType] = useState<Option | null>(null);
//   const [licensePlate, setLicensePlate] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const [loadingVehicle, setLoadingVehicle] = useState(false);

//   // Load user
//   useEffect(() => {
//     (async () => {
//       try {
//         const user = await getProfile();
//         setUserId(user?.id ?? 0);
//       } catch (e: any) {
//         console.log("Lỗi getProfile:", e?.response?.data || e?.message);
//       } finally {
//         setLoadingUser(false);
//       }
//     })();
//   }, []);

//   // Load vehicle nếu đang sửa
//   useEffect(() => {
//     if (isEdit && vehicleId) {
//       loadVehicle();
//     }
//   }, [isEdit, vehicleId]);

//   const loadVehicle = async () => {
//     if (!vehicleId) return;
//     try {
//       setLoadingVehicle(true);
//       const vehicle = await getVehicle(vehicleId);
//       setLicensePlate(vehicle.license_plate);

//       const typeOption = VEHICLE_TYPES.find(
//         (t) => t.value === vehicle.vehicle_type
//       );
//       if (typeOption) {
//         setVehicleType(typeOption);
//       }
//     } catch (error: any) {
//       Alert.alert(
//         "Lỗi",
//         error.message || "Không thể tải thông tin phương tiện"
//       );
//     } finally {
//       setLoadingVehicle(false);
//     }
//   };

//   const errors = {
//     licensePlate: !licensePlate.trim() ? "Biển số không được để trống" : null,
//     vehicleType: !vehicleType ? "Vui lòng chọn loại xe" : null,
//   };

//   const hasErrors = Object.values(errors).some(Boolean);

//   const onSubmit = async () => {
//     if (hasErrors || loadingUser || submitting) return;

//     try {
//       setSubmitting(true);

//       if (isEdit && vehicleId) {
//         await updateVehicle(vehicleId, {
//           vehicle_type: vehicleType!.value as VehicleType,
//           license_plate: licensePlate,
//         });
//         // Gọi resubmit để yêu cầu admin duyệt lại
//         await resubmitVehicle(vehicleId);
//         Alert.alert(
//           "Thành công",
//           "Đã cập nhật phương tiện. Phương tiện đang chờ admin duyệt lại.",
//           [{ text: "OK", onPress: () => router.back() }]
//         );
//       } else {
//         await createVehicle({
//           user_id: userId,
//           vehicle_type: vehicleType!.value as VehicleType,
//           license_plate: licensePlate,
//         });
//         Alert.alert(
//           "Thành công",
//           "Đã thêm phương tiện. Phương tiện đang chờ admin duyệt.",
//           [{ text: "OK", onPress: () => router.back() }]
//         );
//       }
//     } catch (error: any) {
//       Alert.alert("Lỗi", error.message || "Không thể lưu phương tiện");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (loadingVehicle) {
//     return (
//       <>
//         <Stack.Screen
//           options={{
//             headerShown: true,
//             title: isEdit ? "SỬA PHƯƠNG TIỆN" : "THÊM PHƯƠNG TIỆN",
//             headerTitleAlign: "center",
//             headerStyle: { backgroundColor: AppColor.PRIMARY },
//             headerShadowVisible: false,
//             headerTitleStyle: {
//               fontWeight: "800",
//               fontSize: 16,
//               color: "#fff",
//             },
//             headerTintColor: "#fff",
//           }}
//         />
//         <SafeAreaView
//           style={{ flex: 1, backgroundColor: "#F9FAFB" }}
//           edges={["top", "bottom"]}
//         >
//           <View
//             style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
//           >
//             <ActivityIndicator size="large" color={AppColor.PRIMARY} />
//             <Text style={{ marginTop: 12, color: "#6B7280" }}>
//               Đang tải...
//             </Text>
//           </View>
//         </SafeAreaView>
//       </>
//     );
//   }

//   return (
//     <>
//       <Stack.Screen
//         options={{
//           headerShown: true,
//           title: isEdit ? "SỬA PHƯƠNG TIỆN" : "THÊM PHƯƠNG TIỆN",
//           headerTitleAlign: "center",
//           headerStyle: { backgroundColor: AppColor.PRIMARY },
//           headerShadowVisible: false,
//           headerTitleStyle: {
//             fontWeight: "800",
//             fontSize: 16,
//             color: "#fff",
//           },
//           headerTintColor: "#fff",
//         }}
//       />
//       <SafeAreaView
//         style={{ flex: 1, backgroundColor: "#F9FAFB" }}
//         edges={["bottom"]}
//       >
//         <KeyboardAvoidingView
//           behavior={Platform.OS === "ios" ? "padding" : undefined}
//           style={{ flex: 1 }}
//         >
//           <ScrollView
//             style={{ flex: 1 }}
//             contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
//             keyboardShouldPersistTaps="handled"
//             showsVerticalScrollIndicator={false}
//           >
//             {/* Card: Thông tin phương tiện */}
//             <View
//               style={{
//                 backgroundColor: "#fff",
//                 borderRadius: 16,
//                 paddingHorizontal: 16,
//                 paddingVertical: 16,
//                 borderWidth: 1,
//                 borderColor: "#E5E7EB",
//                 shadowColor: "#000",
//                 shadowOpacity: 0.04,
//                 shadowRadius: 8,
//                 shadowOffset: { width: 0, height: 2 },
//                 elevation: 2,
//                 marginBottom: 12,
//               }}
//             >
//               <View
//                 style={{
//                   flexDirection: "row",
//                   alignItems: "center",
//                   marginBottom: 14,
//                 }}
//               >
//                 <View
//                   style={{
//                     width: 36,
//                     height: 36,
//                     borderRadius: 12,
//                     backgroundColor: `${AppColor.PRIMARY}15`,
//                     alignItems: "center",
//                     justifyContent: "center",
//                     marginRight: 10,
//                   }}
//                 >
//                   <Ionicons
//                     name={isEdit ? "create-outline" : "car-outline"}
//                     size={18}
//                     color={AppColor.PRIMARY}
//                   />
//                 </View>
//                 <Text
//                   style={{
//                     fontWeight: "700",
//                     color: "#111827",
//                     fontSize: 15,
//                   }}
//                 >
//                   Thông tin phương tiện
//                 </Text>
//               </View>

//               <View style={{ marginBottom: 12 }}>
//                 <Select
//                   label="Loại phương tiện"
//                   value={vehicleType}
//                   options={VEHICLE_TYPES}
//                   onSelect={setVehicleType}
//                   error={errors.vehicleType}
//                 />
//               </View>

//               <Field
//                 label="Biển số xe"
//                 value={licensePlate}
//                 onChangeText={setLicensePlate}
//                 placeholder="VD: 51A-12345"
//                 autoCapitalize="characters"
//                 error={errors.licensePlate}
//               />

//               <View
//                 style={{
//                   marginTop: 10,
//                   paddingHorizontal: 12,
//                   paddingVertical: 10,
//                   borderRadius: 12,
//                   backgroundColor: "#F3F4F6",
//                 }}
//               >
//                 <Text
//                   style={{
//                     fontSize: 11,
//                     color: "#6B7280",
//                     lineHeight: 16,
//                   }}
//                 >
//                   • Viết HOA và đúng định dạng để kiểm tra nhanh{"\n"}•
//                   {isEdit
//                     ? " Khi chỉnh sửa sẽ yêu cầu admin duyệt lại"
//                     : " Phương tiện cần được admin duyệt trước khi sử dụng"}
//                 </Text>
//               </View>
//             </View>

//             {/* Actions */}
//             <View style={{ flexDirection: "row", gap: 10 }}>
//               <TouchableOpacity
//                 onPress={() => router.back()}
//                 activeOpacity={0.8}
//                 style={{
//                   flex: 1,
//                   height: 52,
//                   borderRadius: 14,
//                   borderWidth: 2,
//                   borderColor: "#E5E7EB",
//                   backgroundColor: "#fff",
//                   alignItems: "center",
//                   justifyContent: "center",
//                 }}
//               >
//                 <Text
//                   style={{
//                     color: "#374151",
//                     fontWeight: "700",
//                     fontSize: 15,
//                   }}
//                 >
//                   Hủy
//                 </Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 onPress={onSubmit}
//                 disabled={hasErrors || submitting || loadingUser}
//                 activeOpacity={0.85}
//                 style={{
//                   flex: 1,
//                   height: 52,
//                   borderRadius: 14,
//                   alignItems: "center",
//                   justifyContent: "center",
//                   backgroundColor:
//                     hasErrors || submitting || loadingUser
//                       ? "#C7D2FE"
//                       : AppColor.PRIMARY,
//                   shadowColor:
//                     hasErrors || submitting || loadingUser
//                       ? "transparent"
//                       : AppColor.PRIMARY,
//                   shadowOpacity:
//                     hasErrors || submitting || loadingUser ? 0 : 0.3,
//                   shadowRadius: 10,
//                   shadowOffset: { width: 0, height: 4 },
//                   elevation: hasErrors || submitting || loadingUser ? 0 : 5,
//                 }}
//               >
//                 {submitting ? (
//                   <ActivityIndicator size="small" color="#fff" />
//                 ) : (
//                   <View
//                     style={{ flexDirection: "row", alignItems: "center" }}
//                   >
//                     <Ionicons
//                       name={isEdit ? "checkmark-circle" : "add-circle"}
//                       size={20}
//                       color="#fff"
//                     />
//                     <Text
//                       style={{
//                         color: "#fff",
//                         fontWeight: "800",
//                         marginLeft: 8,
//                         fontSize: 15,
//                       }}
//                     >
//                       {isEdit ? "Lưu thay đổi" : "Thêm phương tiện"}
//                     </Text>
//                   </View>
//                 )}
//               </TouchableOpacity>
//             </View>
//           </ScrollView>
//         </KeyboardAvoidingView>
//       </SafeAreaView>
//     </>
//   );
// }
