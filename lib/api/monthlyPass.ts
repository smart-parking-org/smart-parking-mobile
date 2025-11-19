import { apiPayment } from "./client";
import { parseApiError } from "./error";

export interface MonthlyPass {
  id: number;
  user_id: number;
  vehicle_id: number;
  parking_lot_id: number;
  months: number;
  start_date: string | null;
  end_date: string | null;
  amount: number;
  status: "PENDING" | "ACTIVE" | "CANCELLED" | "EXPIRED" | "FAILED";
  order_id: string;
  txn_ref: string | null;
  user_snapshot: {
    id: number;
    name: string;
    email: string;
    phone: string;
  } | null;
  vehicle_snapshot: {
    id: number;
    license_plate: string;
    vehicle_type: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMonthlyPassRequest {
  user_id: number;
  vehicle_id: number;
  parking_lot_id: number;
  months?: number;
  start_date?: string;
  bank_code?: string;
}

export interface CreateMonthlyPassResponse {
  id: number;
  order_id: string;
  txn_ref: string;
  amount: number;
  payUrl: string;
}

export interface MonthlyPassesResponse {
  data: MonthlyPass[];
}

/**
 * Lấy danh sách vé tháng của user hiện tại
 */
export async function getMyMonthlyPasses(
  userId: number
): Promise<MonthlyPass[]> {
  try {
    const { data } = await apiPayment.get<MonthlyPassesResponse>(
      "/monthly-passes/mine",
      {
        params: { user_id: userId },
      }
    );
    return data.data;
  } catch (err: any) {
    const message = parseApiError(err);
    throw new Error(message);
  }
}

/**
 * Tạo vé tháng mới
 */
export async function createMonthlyPass(
  payload: CreateMonthlyPassRequest
): Promise<CreateMonthlyPassResponse> {
  try {
    const { data } = await apiPayment.post<CreateMonthlyPassResponse>(
      "/monthly-passes",
      payload
    );
    return data;
  } catch (err: any) {
    const message = parseApiError(err);
    throw new Error(message);
  }
}

/**
 * Lấy chi tiết vé tháng
 */
export async function getMonthlyPass(id: number): Promise<MonthlyPass> {
  try {
    const { data } = await apiPayment.get<{ data: MonthlyPass }>(
      `/monthly-passes/${id}`
    );
    return data.data;
  } catch (err: any) {
    const message = parseApiError(err);
    throw new Error(message);
  }
}

/**
 * Hủy vé tháng (chỉ khi status PENDING)
 */
export async function cancelMonthlyPass(id: number): Promise<MonthlyPass> {
  try {
    const { data } = await apiPayment.put<{ data: MonthlyPass }>(
      `/monthly-passes/${id}/cancel`
    );
    return data.data;
  } catch (err: any) {
    const message = parseApiError(err);
    throw new Error(message);
  }
}

/**
 * Tạo URL thanh toán cho vé tháng PENDING
 */
export async function createMonthlyPassPayment(
  id: number,
  bankCode?: string
): Promise<CreateMonthlyPassResponse> {
  try {
    const { data } = await apiPayment.post<CreateMonthlyPassResponse>(
      `/monthly-passes/${id}/create-payment`,
      bankCode ? { bank_code: bankCode } : {}
    );
    return data;
  } catch (err: any) {
    const message = parseApiError(err);
    throw new Error(message);
  }
}


