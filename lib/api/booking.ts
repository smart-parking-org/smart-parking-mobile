import { apiPayment } from "./client";

export type CreateReservationPayload = {
  parking_lot_id: number;
  user_id: number;
  vehicle_id: number;
  vehicle_type: "motorbike" | "car_4_seat" | "car_7_seat" | "light_truck";
  desired_start_time: string;
  duration_minutes: number;
  gate_id?: number;
};

export type ReservationResponse = {
  success: boolean;
  message: string;
  data: {
    reservation: {
      id: number;
      reservation_code: string;
      status: string;
      start_time: string;
      end_time: string;
      expires_at: string;
    };
    allocated_slot: {
      id: number;
      slot_code: string;
      vehicle_type: string;
    };
    qr_payload: string;
  };
};

// Type cho reservation từ index endpoint
export type Reservation = {
  id: number;
  reservation_code: string;
  status: string;
  start_time: string;
  end_time: string;
  expires_at: string;
  slot?: {
    id: number;
    slot_code: string;
    vehicle_type: string;
    parking_lot?: {
      id: number;
      name: string;
    };
  };
  gate?: {
    id: number;
    parking_lot_id: number;
    gate_code: string;
    gate_type: "entry" | "exit" | "both";
    position_x: string;
    position_y: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
  };
  user_snapshot?: {
    id: number;
    name: string;
    phone: string;
  };
  vehicle_snapshot?: {
    id: number;
    license_plate: string;
    vehicle_type: string;
  };
  payment?: {
    id: number;
    amount: number;
    status: string; // 'PAID' hoặc 'PENDING'
    meta?: {
      payment_method?: string;
      monthly_pass_id?: number;
      is_free?: boolean;
    };
  } | null;
  monthly_pass?: {
    id: number;
    order_id: string;
    end_date?: string;
  } | null;
  is_free?: boolean;
  skip_payment?: boolean;
};

export async function createReservation(
  payload: CreateReservationPayload
): Promise<ReservationResponse> {
  try {
    const response = await apiPayment.post<ReservationResponse>(
      "/reservations",
      payload
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

// Lấy danh sách reservations của user hiện tại
export async function getMyActiveReservations(
  userId: number
): Promise<Reservation[]> {
  try {
    const { data } = await apiPayment.get<{
      success: boolean;
      data: {
        reservations: Reservation[];
        pagination: any;
        summary: any;
      };
    }>("/reservations", {
      params: {
        user_id: userId,
        // Không filter status ở đây, sẽ filter phía client
      },
    });

    console.log(
      `📋 Got ${data.data.reservations.length} total reservations for user ${userId}`
    );

    // Filter phía client: chỉ lấy confirmed, checked_in và pending_checkout
    // Loại bỏ expired, cancelled, checked_out
    const activeReservations = data.data.reservations.filter(
      (r) =>
        r.status === "confirmed" ||
        r.status === "checked_in" ||
        r.status === "pending_payment" ||
        r.status === "pending_checkout"
    );

    console.log(
      `✅ Filtered to ${activeReservations.length} active reservations`
    );
    return activeReservations;
  } catch (error: any) {
    console.error("❌ Error getting reservations:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
}

// Check-out một reservation với phương thức thanh toán
export async function checkOutReservation(
  reservationId: number,
  paymentMethod: "online" | "offline" = "online"
) {
  try {
    const response = await apiPayment.put(
      `/reservations/${reservationId}/check-out`,
      {
        payment_method: paymentMethod,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("❌ Error during checkout:", error);
    throw error;
  }
}

// Lấy QR checkout code cho reservation
export async function getCheckoutCode(reservationId: number) {
  try {
    const response = await apiPayment.get<{
      success: boolean;
      data: {
        checkout_code: string;
        status: string;
        expires_at?: string;
        qr_data: string;
      };
    }>(`/reservations/${reservationId}/checkout-code`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Error getting checkout code:", error);
    throw error;
  }
}

// Gọi API expireDue để đánh dấu các reservations hết hạn
export async function expireDue() {
  try {
    const response = await apiPayment.post<{
      success: boolean;
      message: string;
      data: {
        expired_count: number;
      };
    }>("/reservations/expire-due");
    return response.data;
  } catch (error: any) {
    console.error("❌ Error expiring reservations:", error);
    throw error;
  }
}

// Gia hạn reservation
export async function extendReservation(
  reservationId: number,
  additionalMinutes: number = 15
) {
  try {
    const response = await apiPayment.put<{
      success: boolean;
      message: string;
      data: Reservation;
    }>(`/reservations/${reservationId}/extend`, {
      additional_minutes: additionalMinutes,
    });
    return response.data;
  } catch (error: any) {
    console.error("❌ Error extending reservation:", error);
    throw error;
  }
}

// Hủy reservation
export async function cancelReservation(reservationId: number) {
  try {
    const response = await apiPayment.put<{
      success: boolean;
      message: string;
      data: Reservation;
    }>(`/reservations/${reservationId}/cancel`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Error cancelling reservation:", error);
    throw error;
  }
}

// Check-in reservation
export async function checkInReservation(reservationId: number) {
  try {
    const response = await apiPayment.put<{
      success: boolean;
      message: string;
      data: {
        reservation: Reservation;
        checkout_code?: {
          checkout_code: string;
          status: string;
          expires_at?: string;
          qr_data: string;
        };
        monthly_pass?: {
          id: number;
          order_id: string;
          end_date?: string;
        } | null;
        is_free?: boolean;
        skip_payment?: boolean;
      };
    }>(`/reservations/${reservationId}/check-in`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Error checking in reservation:", error);
    throw error;
  }
}
