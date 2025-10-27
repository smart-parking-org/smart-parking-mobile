import { apiPayment } from "./client";

export type ParkingLot = {
  id: number;
  name: string;
  gate_pos_x: string;
  gate_pos_y: string;
  created_at?: string;
  updated_at?: string;
};

export type ParkingLotSlotSummary = {
  total: number;
  available: number;
  hold: number;
  occupied: number;
};

export type ParkingLotStats = {
  parking_lot_id: number;
  parking_lot_name: string;
  summary: ParkingLotSlotSummary;
  by_vehicle_type: Record<string, ParkingLotSlotSummary>;
  last_updated: string;
};

/**
 * Lấy danh sách tất cả bãi đỗ xe
 */
export async function getParkingLots(): Promise<ParkingLot[]> {
  try {
    const { data } = await apiPayment.get<ParkingLot[]>("/parking-lots"); // Bỏ /api
    return data;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Lấy thống kê bãi đỗ xe (slots available, occupied, hold)
 */
export async function getParkingLotStatistics(id: number): Promise<ParkingLotStats> {
  try {
    const { data } = await apiPayment.get<ParkingLotStats>(`/parking-lots/${id}/statistics`); // Bỏ /api
    return data;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Lấy danh sách slots của một bãi đỗ xe
 */
export async function getParkingLotSlots(id: number) {
  try {
    const { data } = await apiPayment.get(`/parking-lots/${id}/slots`); // Bỏ /api
    return data;
  } catch (error: any) {
    throw error;
  }
}