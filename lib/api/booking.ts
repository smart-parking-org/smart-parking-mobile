import { apiPayment } from "./client";

export type CreateReservationPayload = {
  parking_lot_id: number;
  user_id: number;
  vehicle_id: number;
  vehicle_type: "motorbike" | "car_4_seat" | "car_7_seat" | "light_truck";
  desired_start_time: string;
  duration_minutes: number;
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
};

export async function createReservation(
  payload: CreateReservationPayload
): Promise<ReservationResponse> {
  try {
    const response = await apiPayment.post<ReservationResponse>("/reservations", payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

// Lấy danh sách reservations của user hiện tại
export async function getMyActiveReservations(userId: number): Promise<Reservation[]> {
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
    
    console.log(`📋 Got ${data.data.reservations.length} total reservations for user ${userId}`);
    
    // Filter phía client: chỉ lấy confirmed, checked_in và pending_checkout
    // Loại bỏ expired, cancelled, checked_out
    const activeReservations = data.data.reservations.filter(
      (r) =>
        (r.status === "confirmed" ||
          r.status === "checked_in" ||
          r.status === "pending_checkout") &&
        r.status !== "expired" &&
        r.status !== "cancelled" &&
        r.status !== "checked_out"
    );
    
    console.log(`✅ Filtered to ${activeReservations.length} active reservations`);
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
    const response = await apiPayment.put(`/reservations/${reservationId}/check-out`, {
      payment_method: paymentMethod,
    });
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