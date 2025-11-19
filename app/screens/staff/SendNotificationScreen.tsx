import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppColor } from "@/lib/utils/color";
import {
  sendNotification,
  SendNotificationResponse,
} from "@/lib/api/notifications";

const DEFAULT_TITLE = "Thông báo từ bãi xe";
const DEFAULT_TYPE = "staff_manual";

export default function SendNotificationScreen() {
  const [licensePlate, setLicensePlate] = useState("");
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    const plate = licensePlate.trim();
    const notificationTitle = title.trim();
    const notificationBody = body.trim();

    if (!plate) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập biển số xe.");
      return;
    }

    if (!notificationTitle || !notificationBody) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề và nội dung.");
      return;
    }

    try {
      setSending(true);
      const response: SendNotificationResponse = await sendNotification({
        license_plate: plate,
        title: notificationTitle,
        body: notificationBody,
        type: DEFAULT_TYPE,
        data: {
          sender: "staff",
        },
      });

      Alert.alert(
        "Thành công",
        response?.message || "Đã gửi thông báo cho cư dân.",
        [
          {
            text: "OK",
            onPress: () => {},
          },
        ]
      );

      setBody("");
      setLicensePlate("");
      setTitle(DEFAULT_TITLE);
    } catch (error: any) {
      Alert.alert("Gửi thất bại", error?.message || "Vui lòng thử lại sau.");
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#f5f6fb]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="p-4 pb-10"
      >
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: `${AppColor.PRIMARY}15` }}
            >
              <Ionicons name="car-outline" size={20} color={AppColor.PRIMARY} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">
                Gửi thông báo theo biển số
              </Text>
              <Text className="text-xs text-gray-500">
                Endpoint: /api/notifications/send
              </Text>
            </View>
          </View>

          <Text className="text-sm text-gray-700 mb-1">Biển số xe *</Text>
          <TextInput
            value={licensePlate}
            onChangeText={setLicensePlate}
            placeholder="VD: 51H-123.45"
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4"
          />

          <Text className="text-sm text-gray-700 mb-1">Tiêu đề *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Nhập tiêu đề"
            placeholderTextColor="#94a3b8"
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4"
          />

          <Text className="text-sm text-gray-700 mb-1">Nội dung *</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Nhập nội dung thông báo"
            placeholderTextColor="#94a3b8"
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            disabled={sending}
            onPress={handleSubmit}
            className={`rounded-2xl py-4 items-center ${
              sending ? "bg-gray-400" : ""
            }`}
            style={{
              backgroundColor: sending ? "#9ca3af" : AppColor.PRIMARY,
            }}
          >
            <Text className="text-white font-semibold text-base">
              {sending ? "Đang gửi..." : "Gửi thông báo"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-2xl p-4">
          <Text className="text-base font-semibold text-gray-800 mb-2">
            Hướng dẫn nhanh
          </Text>
          <Text className="text-sm text-gray-600 mb-1">
            • Nhập chính xác biển số của cư dân để hệ thống tìm đúng người nhận.
          </Text>
          <Text className="text-sm text-gray-600 mb-1">
            • Thông báo sẽ được lưu lại trong lịch sử nhận thông báo của cư dân.
          </Text>
          <Text className="text-sm text-gray-600">
            • Nếu không tìm thấy cư dân tương ứng, bạn sẽ nhận được thông báo
            lỗi.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

