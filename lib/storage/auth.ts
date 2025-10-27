import * as SecureStore from "expo-secure-store";

const AT  = "access_token";
const RT  = "refresh_token";
const EXP = "access_exp_unix"; // seconds (UNIX)

export async function saveTokens(
  access: string,
  refresh?: string,
  expiresInSec?: number
) {
  await SecureStore.setItemAsync(AT, access);
  if (refresh) await SecureStore.setItemAsync(RT, refresh);
  if (expiresInSec) {
    const exp = Math.floor(Date.now() / 1000) + expiresInSec;
    await SecureStore.setItemAsync(EXP, String(exp));
  }
}

export const  getAccessToken  = async () => await SecureStore.getItemAsync(AT);
export const getRefreshToken = () => SecureStore.getItemAsync(RT);
export const getAccessExp    = async () => {
  const v = await SecureStore.getItemAsync(EXP);
  return v ? Number(v) : null;
};
export async function clearTokens() {
  await SecureStore.deleteItemAsync(AT);
  await SecureStore.deleteItemAsync(RT);
  await SecureStore.deleteItemAsync(EXP);
}
