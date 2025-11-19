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
  TextInput,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  useEffect(() => {
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        // Không reset scroll, để KeyboardAvoidingView tự xử lý
        // Chỉ đảm bảo scroll không bị stuck ở vị trí xa
      }
    );

    return () => {
      hideSubscription.remove();
    };
  }, []);

  const platePreview =
    licensePlate.trim().length > 0
      ? licensePlate.trim().toUpperCase()
      : "XX-000.00";
  
  // Kiểm tra format biển số theo regex mới
  const isValidPlateFormat = /^[0-9]{2}(?:[ABCEFGHKLMNPSTUVXYZ]{1,2})(?:[1-9])?-(?:[0-9]{4}|[0-9]{3}\.[0-9]{2})$/.test(
    licensePlate.trim().toUpperCase()
  );

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
                {/* Header với màu primary */}
                <View
                  style={{
                    backgroundColor: AppColor.PRIMARY,
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
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
                </View>

                {/* Body */}
                <ScrollView
                  ref={scrollViewRef}
                  style={{ backgroundColor: "#F9FAFB" }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingTop: 16,
                    paddingBottom: 24,
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
                      />
                    </View>

                    <View style={{ marginBottom: 12 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ color: "#6B7280", fontSize: 14 }}>
                          Biển số xe
                        </Text>
                      </View>
                      <View style={{ position: "relative" }}>
                        <TextInput
                          value={licensePlate}
                          onChangeText={(text) => {
                            // Tự động chuyển thành uppercase
                            onChangeLicense(text.toUpperCase());
                          }}
                          placeholder="51A-123.45"
                          placeholderTextColor="#9ca3af"
                          autoCapitalize="characters"
                          style={{
                            height: 48,
                            borderRadius: 16,
                            paddingHorizontal: 16,
                            paddingRight: isValidPlateFormat ? 44 : 16,
                            borderWidth: 1,
                            borderColor: isValidPlateFormat
                              ? AppColor.PRIMARY
                              : "#D1D5DB",
                            backgroundColor: "#fff",
                            fontSize: 15,
                            textTransform: "uppercase",
                          }}
                        />
                        {isValidPlateFormat && (
                          <View
                            style={{
                              position: "absolute",
                              right: 12,
                              top: 12,
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: AppColor.PRIMARY,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          </View>
                        )}
                      </View>
                    </View>
                    
                    {/* Mẫu biển số */}
                    <View
                      style={{
                        marginTop: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: "#F0F9FF",
                        borderWidth: 1,
                        borderColor: "#BAE6FD",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons
                          name="information-circle-outline"
                          size={14}
                          color="#0284C7"
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#0284C7",
                            fontWeight: "600",
                          }}
                        >
                          Mẫu biển số:{" "}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#0C4A6E",
                            fontWeight: "700",
                            fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                          }}
                        >
                          51A-123.45
                        </Text>
                      </View>
                    </View>

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
                        {isEditMode
                          ? " Khi chỉnh sửa sẽ yêu cầu admin duyệt lại"
                          : " Phương tiện cần được admin duyệt trước khi sử dụng"}
                      </Text>
                    </View>
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
