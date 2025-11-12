import { AppColor } from "@/lib/utils/color";
import { Stack, useFocusEffect, router } from "expo-router";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo, useEffect, useCallback } from "react";
import * as Haptics from "expo-haptics";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  Notification as ApiNotification,
} from "@/lib/api/notifications";
import { getProfile } from "@/lib/api/auth";

// Types
type NotificationType =
  | "parking_time_expiring"
  | "reservation_hold_expiring"
  | "payment_required"
  | "other";
type NotificationStatus = "read" | "unread";

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  actionUrl?: string;
  reservationId?: number; // Lưu reservation_id từ data để navigate
}

// Helper: Map API notification to UI notification
function mapApiNotificationToUI(apiNotif: ApiNotification): Notification {
  let mappedType: NotificationType = "other";

  if (
    apiNotif.type === "parking_time_expiring" ||
    apiNotif.type === "reservation_hold_expiring"
  ) {
    mappedType = apiNotif.type as NotificationType;
  } else if (apiNotif.type === "payment_required") {
    mappedType = "payment_required";
  } else {
    mappedType = "other";
  }

  // Parse data từ notification để lấy reservation_id
  let reservationId: number | undefined;
  if (apiNotif.data) {
    try {
      // Nếu data là string (JSON), parse nó
      const dataObj =
        typeof apiNotif.data === "string"
          ? JSON.parse(apiNotif.data)
          : apiNotif.data;

      if (dataObj && dataObj.reservation_id) {
        reservationId = parseInt(String(dataObj.reservation_id), 10);
      }
    } catch (error) {
      console.error("Error parsing notification data:", error);
    }
  }

  return {
    id: apiNotif.id,
    type: mappedType,
    title: apiNotif.title,
    body: apiNotif.body,
    status: apiNotif.is_read ? "read" : "unread",
    createdAt: apiNotif.created_at,
    actionUrl: apiNotif.action_url,
    reservationId,
  };
}

// Filter tabs
const FILTER_TABS = [
  { label: "Tất cả", value: "all" },
  { label: "Chưa đọc", value: "unread" },
  { label: "Đã đọc", value: "read" },
] as const;

type FilterValue = (typeof FILTER_TABS)[number]["value"];

// Helper functions
function getNotificationIcon(type: NotificationType) {
  const icons = {
    parking_time_expiring: (color: string) => (
      <Ionicons name="time" size={20} color={color} />
    ),
    reservation_hold_expiring: (color: string) => (
      <Ionicons name="hourglass" size={20} color={color} />
    ),
    payment_required: (color: string) => (
      <Ionicons name="card" size={20} color={color} />
    ),
    other: (color: string) => (
      <Ionicons name="notifications" size={20} color={color} />
    ),
  };
  return icons[type] || icons.other;
}

function getNotificationColor(type: NotificationType) {
  const colors = {
    parking_time_expiring: {
      primary: "#DC2626",
      bg: "#FEE2E2",
    },
    reservation_hold_expiring: {
      primary: "#D97706",
      bg: "#FEF3C7",
    },
    payment_required: {
      primary: "#10b981", // Green color cho payment
      bg: "#D1FAE5",
    },
    other: {
      primary: "#6366F1",
      bg: "#EEF2FF",
    },
  };
  return colors[type] || colors.other;
}

function getNotificationBadge(type: NotificationType) {
  const badges = {
    parking_time_expiring: "10 phút",
    reservation_hold_expiring: "5 phút",
    payment_required: "Thanh toán",
    other: null,
  };
  return badges[type];
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Components
function FilterTabs({
  selected,
  onSelect,
}: {
  selected: FilterValue;
  onSelect: (value: FilterValue) => void;
}) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
      }}
    >
      <View style={{ flexDirection: "row", gap: 0 }}>
        {FILTER_TABS.map((tab) => {
          const active = selected === tab.value;
          return (
            <TouchableOpacity
              key={tab.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(tab.value);
              }}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                borderBottomWidth: active ? 2 : 0,
                borderBottomColor: active ? AppColor.PRIMARY : "transparent",
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: active ? "600" : "400",
                  color: active ? AppColor.PRIMARY : "#6B7280",
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function NotificationCard({
  notification,
  onPress,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onPress: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const isUnread = notification.status === "unread";
  const { primary, bg } = getNotificationColor(notification.type);
  const icon = getNotificationIcon(notification.type);
  const badge = getNotificationBadge(notification.type);

  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          borderWidth: 1,
          padding: 6,
          paddingVertical: 12,
          borderColor: "#E5E7EB",
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            backgroundColor: isUnread ? bg : "#F3F4F6",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            borderWidth: isUnread ? 1 : 0,
            borderColor: isUnread ? `${primary}20` : "transparent",
          }}
        >
          {icon(isUnread ? primary : "#6B7280")}
        </View>

        {/* Content */}
        <View style={{ flex: 1, minWidth: 0, paddingLeft: isUnread ? 0 : 0 }}>
          {/* Title row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 4,
              gap: 8,
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: isUnread ? "700" : "500",
                  color: isUnread ? "#111827" : "#6B7280",
                  flex: 1,
                  letterSpacing: isUnread ? -0.2 : 0,
                }}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              {isUnread && (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: primary,
                    flexShrink: 0,
                    borderWidth: 2,
                    borderColor: "#fff",
                  }}
                />
              )}
            </View>
            <Text
              style={{
                fontSize: 11,
                color: isUnread ? "#6B7280" : "#9CA3AF",
                fontWeight: isUnread ? "500" : "400",
                flexShrink: 0,
              }}
            >
              {formatTime(notification.createdAt)}
            </Text>
          </View>

          {/* Body */}
          <Text
            style={{
              fontSize: 13,
              color: isUnread ? "#374151" : "#6B7280",
              lineHeight: 20,
              marginBottom: 12,
              fontWeight: isUnread ? "400" : "400",
            }}
            numberOfLines={2}
          >
            {notification.body}
          </Text>

          {/* Footer */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {badge && (
              <View
                style={{
                  backgroundColor: isUnread ? primary : "#E5E7EB",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: isUnread ? "#fff" : "#6B7280",
                  }}
                >
                  {badge}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 8, marginLeft: "auto" }}>
              {isUnread && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onMarkRead();
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Đã đọc
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: isUnread ? "#FEF2F2" : "#F3F4F6",
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={isUnread ? "#DC2626" : "#6B7280"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
        paddingTop: 100,
      }}
    >
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          backgroundColor: "#F3F4F6",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Ionicons name="notifications-off-outline" size={40} color="#9CA3AF" />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: "#111827",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        Chưa có thông báo
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: "#6B7280",
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Bạn chưa có thông báo nào
      </Text>
    </View>
  );
}

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterValue>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Lấy user ID khi component mount
  useEffect(() => {
    (async () => {
      try {
        const user = await getProfile();
        const userData = user?.data || user;
        if (userData?.id) {
          setUserId(userData.id);
        }
      } catch (error) {
        console.error("Error getting user profile:", error);
        Alert.alert("Lỗi", "Không thể lấy thông tin người dùng");
      }
    })();
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (page: number = 1, reset: boolean = false) => {
      if (!userId) return;

      try {
        const params: any = {
          user_id: userId,
          per_page: 20,
        };

        if (selectedFilter === "unread") {
          params.is_read = false;
        } else if (selectedFilter === "read") {
          params.is_read = true;
        }

        const response = await getNotifications(params);

        const mappedNotifications = response.data.map(mapApiNotificationToUI);

        if (reset) {
          setNotifications(mappedNotifications);
        } else {
          setNotifications((prev) => [...prev, ...mappedNotifications]);
        }

        setUnreadCount(response.unread_count);
        setCurrentPage(page);
        setHasMore(page < response.meta.last_page);
      } catch (error: any) {
        console.error("Error fetching notifications:", error);
        Alert.alert("Lỗi", error.message || "Không thể tải thông báo");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, selectedFilter]
  );

  // Fetch khi userId hoặc filter thay đổi
  useEffect(() => {
    if (userId) {
      setLoading(true);
      setCurrentPage(1);
      fetchNotifications(1, true);
    }
  }, [userId, selectedFilter, fetchNotifications]);

  // Tự động refresh khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        setCurrentPage(1);
        setLoading(true);
        fetchNotifications(1, true);
      }
    }, [userId, fetchNotifications])
  );

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    if (selectedFilter === "all") return notifications;
    return notifications.filter((n) => n.status === selectedFilter);
  }, [notifications, selectedFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (userId) {
      await fetchNotifications(1, true);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, status: "read" as NotificationStatus } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể đánh dấu đã đọc");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;

    try {
      await markAllNotificationsAsRead(userId);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: "read" as NotificationStatus }))
      );
      setUnreadCount(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể đánh dấu tất cả đã đọc");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      const deleted = notifications.find((n) => n.id === id);
      if (deleted?.status === "unread") {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể xóa thông báo");
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Đánh dấu đã đọc nếu chưa đọc
    if (notification.status === "unread") {
      handleMarkAsRead(notification.id);
    }

    // Xử lý navigation dựa trên type
    if (notification.type === "payment_required") {
      // Navigate đến PaymentScreen với reservation_id
      if (notification.reservationId) {
        router.push({
          pathname: "/screens/reservations/PaymentScreen",
          params: {
            reservationId: String(notification.reservationId),
          },
        });
      } else {
        Alert.alert("Lỗi", "Không tìm thấy thông tin đặt chỗ để thanh toán");
      }
    } else if (notification.actionUrl) {
      // Xử lý các action URL khác nếu có
      console.log("Action URL:", notification.actionUrl);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore && userId) {
      fetchNotifications(currentPage + 1, false);
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "THÔNG BÁO",
            headerTitleAlign: "center",
            headerStyle: { backgroundColor: AppColor.PRIMARY },
            headerShadowVisible: false,
            headerTitleStyle: {
              fontWeight: "800",
              fontSize: 16,
              color: "#fff",
            },
            headerTintColor: "#fff",
          }}
        />
        <SafeAreaView
          edges={["bottom"]}
          style={{
            flex: 1,
            backgroundColor: "#F9FAFB",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={AppColor.PRIMARY} />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "THÔNG BÁO",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: AppColor.PRIMARY },
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: "800", fontSize: 16, color: "#fff" },
          headerTintColor: "#fff",
          headerRight: () =>
            unreadCount > 0 ? (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                style={{ paddingVertical: 4, paddingHorizontal: 2 }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  Đọc tất cả
                </Text>
              </TouchableOpacity>
            ) : null,
        }}
      />
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      >
        <FilterTabs selected={selectedFilter} onSelect={setSelectedFilter} />

        {filteredNotifications.length === 0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <NotificationCard
                notification={item}
                onPress={() => handleNotificationPress(item)}
                onMarkRead={() => handleMarkAsRead(item.id)}
                onDelete={() => handleDelete(item.id)}
              />
            )}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={AppColor.PRIMARY}
                colors={[AppColor.PRIMARY]}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loading && notifications.length > 0 ? (
                <View style={{ paddingVertical: 16 }}>
                  <ActivityIndicator size="small" color={AppColor.PRIMARY} />
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}
