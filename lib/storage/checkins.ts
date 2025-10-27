import * as SecureStore from "expo-secure-store";

const KEY = "ACTIVE_CHECKINS_V1";

// Type mới phù hợp với backend API
export type ActiveCheckin = {
  reservation_id: number;
  reservation_code: string;
  slot_code: string;
  vehicle_type: string;
  license_plate: string;
  start_time: string;
  end_time: string;
  status: string;
};

async function read(): Promise<ActiveCheckin[]> {
  try {
    const s = await SecureStore.getItemAsync(KEY);
    return s ? (JSON.parse(s) as ActiveCheckin[]) : [];
  } catch {
    return [];
  }
}

async function write(items: ActiveCheckin[]) {
  await SecureStore.setItemAsync(KEY, JSON.stringify(items));
}

export async function getActiveCheckins(): Promise<ActiveCheckin[]> {
  return await read();
}

// Thêm/cập nhật 1 booking, giữ tối đa 3 item (mới nhất ở đầu)
export async function addActiveCheckin(checkin: ActiveCheckin) {
  const list = await read();
  const filtered = list.filter(x => x.reservation_id !== checkin.reservation_id);
  const next = [checkin, ...filtered].slice(0, 3);
  await write(next);
}

export async function removeActiveCheckin(reservationId: string | number) {
  const list = await read();
  const next = list.filter(x => String(x.reservation_id) !== String(reservationId));
  await write(next);
}

export async function clearActiveCheckins() {
  await write([]);
}