import { apiAuth } from "@/lib/api/client";
import { parseApiError } from "@/lib/api/error";

// Định nghĩa types theo backend
export type VehicleType = "motorbike" | "car_4_seat" | "car_7_seat" | "light_truck";

export interface Vehicle {
  id: number;
  user_id: number;
  vehicle_type: VehicleType;
  license_plate: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
}

export interface VehicleListResponse {
  data: Vehicle[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

// Lấy danh sách phương tiện
export async function getVehicles(userId: number): Promise<VehicleListResponse> {
  try {
    const { data } = await apiAuth.get<VehicleListResponse>("/vehicles", {
      params: { user_id: userId, is_active: true }
    });
    return data;
  } catch (err: any) {
    const message = parseApiError(err);
    throw new Error(message);
  }
}

// Lấy chi tiết phương tiện
export async function getVehicle(id: number): Promise<Vehicle> {
  try {
    const { data } = await apiAuth.get<{ data: Vehicle }>(`/vehicles/${id}`);
    return data.data;
  } catch (err: any) {
    const message = parseApiError(err);
    throw new Error(message);
  }
}

// Tạo phương tiện mới
export interface CreateVehiclePayload {
  user_id: number;
  vehicle_type: VehicleType;
  license_plate: string;
}

export async function createVehicle(payload: CreateVehiclePayload): Promise<Vehicle> {
  try {
    const { data } = await apiAuth.post<{ data: Vehicle }>("/vehicles", payload);
    return data.data;
  } catch (err: any) {
    const message = parseApiError(err);
    throw new Error(message);
  }
}

// Cập nhật phương tiện
export interface UpdateVehiclePayload {
  vehicle_type?: VehicleType;
  license_plate?: string;
}

export async function updateVehicle(id: number, payload: UpdateVehiclePayload): Promise<Vehicle> {
  try {
    const { data } = await apiAuth.patch<{ data: Vehicle }>(`/vehicles/${id}`, payload);
    return data.data;
  } catch (err: any) {
    const message = parseApiError(err);
    throw new Error(message);
  }
}

// Xóa phương tiện
export async function removeVehicle(id: number): Promise<void> {
  try {
    await apiAuth.delete(`/vehicles/${id}`);
  } catch (err: any) {
    const message = parseApiError(err);
    throw new Error(message);
  }
}

// Đặt làm phương tiện mặc định
export async function setPrimaryVehicle(id: number): Promise<Vehicle> {
  try {
    const { data } = await apiAuth.post<{ data: Vehicle }>(`/vehicles/primary/${id}`);
    return data.data;
  } catch (err: any) {
    const message = parseApiError(err);
    throw new Error(message);
  }
}

// Bật/tắt phương tiện
export async function toggleVehicleActive(id: number): Promise<Vehicle> {
  try {
    const { data } = await apiAuth.post<{ data: Vehicle }>(`/vehicles/toggle-active/${id}`);
    return data.data;
  } catch (err: any) {
    const message = parseApiError(err);
    throw new Error(message);
  }
}