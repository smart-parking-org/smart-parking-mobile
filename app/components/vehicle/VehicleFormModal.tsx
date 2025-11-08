import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Platform,
  Animated,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Field from "@/app/components/ui/Field";
import Select, { Option } from "@/app/components/ui/Select";
import { AppColor } from "@/lib/utils/color";

export const VEHICLE_TYPES: Option[] = [
  { label: "Xe máy", value: "motorbike" },
  { label: "Ô tô 4 chỗ", value: "car_4_seat" },
  { label: "Ô tô 7 chỗ", value: "car_7_seat" },
  { label: "Xe tải nhẹ", value: "light_truck" },
];

type VehicleFormModalProps = {
  visible: boolean;
  isEditMode: boolean;
  licensePlate: string;
  vehicleType: Option | null;
  submitting: boolean;
  formSlideAnim: Animated.Value;
  onChangeLicense: (value: string) => void;
  onChangeType: (value: Option | null) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function VehicleFormModal({
  visible,
  isEditMode,
  licensePlate,
  vehicleType,
  submitting,
  formSlideAnim,
  onChangeLicense,
  onChangeType,
  onSubmit,
  onClose,
}: VehicleFormModalProps) {
  const canSubmit =
    Boolean(licensePlate.trim()) && Boolean(vehicleType) && !submitting;

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const platePreview =
    licensePlate.trim().length > 0
      ? licensePlate.trim().toUpperCase()
      : "XX-00000";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Pressable onPress={onClose} style={{ flex: 1 }}>
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              opacity: overlayOpacity,
              justifyContent: "flex-end",
            }}
          >
            <Animated.View
              style={{ transform: [{ translateY: formSlideAnim }] }}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                {/* Header với gradient */}
                <LinearGradient
                  colors={[AppColor.PRIMARY, AppColor.SECONDARY]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    overflow: "hidden",
                    paddingTop: 10,
                    paddingBottom: 20,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 5,
                      borderRadius: 999,
                      backgroundColor: "rgba(255,255,255,0.3)",
                      alignSelf: "center",
                      marginBottom: 16,
                    }}
                  />

                  <View style={{ paddingHorizontal: 20 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: "rgba(255,255,255,0.2)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <Ionicons
                            name={isEditMode ? "create" : "car-outline"}
                            size={20}
                            color="#fff"
                          />
                        </View>
                        <View style={{ flexShrink: 1 }}>
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 18,
                              fontWeight: "800",
                            }}
                            numberOfLines={1}
                          >
                            {isEditMode
                              ? "Chỉnh sửa phương tiện"
                              : "Thêm phương tiện mới"}
                          </Text>
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.9)",
                              fontSize: 13,
                              marginTop: 2,
                            }}
                            numberOfLines={1}
                          >
                            {isEditMode
                              ? "Cập nhật thông tin chính xác"
                              : "Nhập thông tin để đặt chỗ nhanh"}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={onClose}
                        activeOpacity={0.7}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: "rgba(255,255,255,0.2)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: 10,
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>

                    {/* Biển số preview */}
                    {licensePlate.trim().length > 0 && (
                      <View
                        style={{
                          marginTop: 14,
                          alignSelf: "flex-start",
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderRadius: 10,
                          backgroundColor: "rgba(255,255,255,0.2)",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.3)",
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Ionicons
                          name="pricetag-outline"
                          size={12}
                          color="#fff"
                        />
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "800",
                            fontSize: 12,
                            letterSpacing: 0.5,
                            marginLeft: 6,
                          }}
                        >
                          {platePreview}
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>

                {/* Body */}
                <ScrollView
                  style={{ backgroundColor: "#F9FAFB" }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingTop: 16,
                    paddingBottom: Platform.OS === "ios" ? 24 : 100,
                  }}
                >
                  {/* Card: Thông tin */}
                  <View
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 16,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      shadowColor: "#000",
                      shadowOpacity: 0.04,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 14,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: `${AppColor.PRIMARY}15`,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 10,
                        }}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={18}
                          color={AppColor.PRIMARY}
                        />
                      </View>
                      <Text
                        style={{
                          fontWeight: "700",
                          color: "#111827",
                          fontSize: 15,
                        }}
                      >
                        Thông tin phương tiện
                      </Text>
                    </View>

                    <View style={{ marginBottom: 12 }}>
                      <Select
                        label="Loại phương tiện"
                        value={vehicleType}
                        options={VEHICLE_TYPES}
                        onSelect={onChangeType}
                        disabled={isEditMode}
                      />
                    </View>

                    <Field
                      label="Biển số xe"
                      value={licensePlate}
                      onChangeText={onChangeLicense}
                      placeholder="VD: 51A-12345"
                      autoCapitalize="characters"
                    />

                    <View
                      style={{
                        marginTop: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: "#F3F4F6",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#6B7280",
                          lineHeight: 16,
                        }}
                      >
                        • Viết HOA và đúng định dạng để kiểm tra nhanh{"\n"}•
                        Khi chỉnh sửa sẽ không thể đổi loại phương tiện
                      </Text>
                    </View>
                  </View>

                  {/* Card: Mẹo nhanh */}
                  <View
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 16,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      shadowColor: "#000",
                      shadowOpacity: 0.04,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: "#ECFDF5",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 10,
                        }}
                      >
                        <Ionicons
                          name="bulb-outline"
                          size={18}
                          color="#047857"
                        />
                      </View>
                      <Text
                        style={{
                          fontWeight: "700",
                          color: "#111827",
                          fontSize: 15,
                        }}
                      >
                        Mẹo sử dụng nhanh
                      </Text>
                    </View>

                    {[
                      "Thêm một lần dùng nhiều lần",
                      "Đặt mặc định / chỉnh sửa từ danh sách",
                      "Cần hỗ trợ? Liên hệ CSKH trong mục Trợ giúp",
                    ].map((tip, idx) => (
                      <View
                        key={idx}
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                          marginTop: idx > 0 ? 8 : 0,
                        }}
                      >
                        <Ionicons
                          name="ellipse"
                          size={5}
                          color="#9CA3AF"
                          style={{ marginTop: 6, marginRight: 10 }}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#6B7280",
                            lineHeight: 18,
                            flex: 1,
                          }}
                        >
                          {tip}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Actions */}
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TouchableOpacity
                      onPress={onClose}
                      activeOpacity={0.8}
                      style={{
                        flex: 1,
                        height: 52,
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: "#E5E7EB",
                        backgroundColor: "#fff",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#374151",
                          fontWeight: "700",
                          fontSize: 15,
                        }}
                      >
                        Đóng
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={onSubmit}
                      disabled={!canSubmit}
                      activeOpacity={0.85}
                      style={{
                        flex: 1,
                        height: 52,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: canSubmit
                          ? AppColor.PRIMARY
                          : "#C7D2FE",
                        shadowColor: canSubmit
                          ? AppColor.PRIMARY
                          : "transparent",
                        shadowOpacity: canSubmit ? 0.3 : 0,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: canSubmit ? 5 : 0,
                      }}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Ionicons
                            name={
                              isEditMode ? "checkmark-circle" : "add-circle"
                            }
                            size={20}
                            color="#fff"
                          />
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "800",
                              marginLeft: 8,
                              fontSize: 15,
                            }}
                          >
                            {isEditMode ? "Lưu thay đổi" : "Thêm phương tiện"}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
