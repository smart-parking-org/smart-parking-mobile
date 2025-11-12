import { apiPayment } from "./client";
import { parseApiError } from "./error";

// Types theo backend response
export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  action_url?: string;
  data?: any; // Field data để lưu thông tin bổ sung (reservation_id, payment_url, txn_ref, amount, etc.)
}

export interface NotificationListParams {
  user_id: number;
  type?: string;
  is_read?: boolean;
  per_page?: number;
}

export interface NotificationListResponse {
  data: Notification[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  unread_count: number;
}

// Lấy danh sách thông báo
export async function getNotifications(
  params: NotificationListParams
): Promise<NotificationListResponse> {
  try {
    const { data } = await apiPayment.get<NotificationListResponse>(
      "/notifications",
      {
        params: {
          user_id: params.user_id,
          ...(params.type && { type: params.type }),
          ...(params.is_read !== undefined && { is_read: params.is_read }),
          ...(params.per_page && { per_page: params.per_page }),
        },
      }
    );
    return data;
  } catch (err: any) {
    const message = parseApiError(err);
    throw new Error(message);
  }
}

// Đánh dấu thông báo đã đọc
export async function markNotificationAsRead(
  notificationId: number
): Promise<void> {
  try {
    await apiPayment.put(`/notifications/${notificationId}/read`);
  } catch (err: any) {
    const message = parseApiError(err);
    throw new Error(message);
  }
}

// Đánh dấu tất cả thông báo đã đọc
export async function markAllNotificationsAsRead(
  userId: number
): Promise<void> {
  try {
    await apiPayment.put(`/notifications/mark-all-read`, {
      user_id: userId,
    });
  } catch (err: any) {
    const message = parseApiError(err);
    throw new Error(message);
  }
}

// Xóa thông báo
export async function deleteNotification(
  notificationId: number
): Promise<void> {
  try {
    await apiPayment.delete(`/notifications/${notificationId}`);
  } catch (err: any) {
    const message = parseApiError(err);
    throw new Error(message);
  }
}
