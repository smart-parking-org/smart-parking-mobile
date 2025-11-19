import * as SecureStore from "expo-secure-store";

const AT = "access_token";
const EXP = "access_exp_unix"; // seconds (UNIX)

export async function saveTokens(access: string, expiresInSec?: number) {
  await SecureStore.setItemAsync(AT, access);
  if (expiresInSec) {
    const exp = Math.floor(Date.now() / 1000) + expiresInSec;
    await SecureStore.setItemAsync(EXP, String(exp));
  }
}

export const getAccessToken = async () => await SecureStore.getItemAsync(AT);
export const getAccessExp = async () => {
  const v = await SecureStore.getItemAsync(EXP);
  return v ? Number(v) : null;
};
export async function clearTokens() {
  await SecureStore.deleteItemAsync(AT);
  await SecureStore.deleteItemAsync(EXP);
}
