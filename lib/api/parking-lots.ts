import { VehicleType } from "@/lib/api/vehicles";
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
  by_vehicle_type: Record<VehicleType, ParkingLotSlotSummary>;
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
export async function getParkingLotStatistics(
  id: number
): Promise<ParkingLotStats> {
  try {
    const { data } = await apiPayment.get<ParkingLotStats>(
      `/parking-lots/${id}/statistics`
    ); // Bỏ /api
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

export type PricingRule = {
  id: number;
  parking_lot_id: number;
  vehicle_type: VehicleType;
  hourly: number;
  daily_cap: number;
  monthly_pass: number;
  peak_enabled: boolean;
  peak_multiplier: number;
  created_at?: string;
  updated_at?: string;
};

export type ParkingLotPricingRules = {
  parking_lot: ParkingLot;
  pricing_rules: PricingRule[];
};

/**
 * Lấy pricing rules của một bãi đỗ xe
 */
export async function getParkingLotPricingRules(
  id: number
): Promise<ParkingLotPricingRules> {
  try {
    const { data } = await apiPayment.get<ParkingLotPricingRules>(
      `/parking-lots/${id}/pricing-rules`
    );
    return data;
  } catch (error: any) {
    throw error;
  }
}
