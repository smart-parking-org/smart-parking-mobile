import { AxiosError } from "axios";


const customMessages: Record<string, string> = {
  "The email has already been taken.": "Email này đã được sử dụng",
  "The phone has already been taken.": "Số điện thoại đã được đăng ký",
  "The cccd hash has already been taken.": "CCCD này đã được dùng",
};

export function parseApiError(error: any): string {
  const data = error?.response?.data;
  if (!data) return "Lỗi không xác định";

  // Nếu có nhiều lỗi -> gom hết lại
  if (data.errors) {
    const msgs: string[] = [];
    for (const field of Object.keys(data.errors)) {
      const first = data.errors[field]?.[0];
      if (first) {
        msgs.push(customMessages[first] || first);
      }
    }
    return msgs.join("\n"); // xuống dòng từng lỗi
  }

  return data.message || "Lỗi không xác định";
}