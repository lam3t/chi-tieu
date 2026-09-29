import { SyncErrorCode } from "@/types/drive";

export interface ClassifiedDriveError {
  code: SyncErrorCode;
  userMessage: string;
  detail: string;
  actionUrl?: string;
  actionType: "enable_api" | "relogin" | "retry";
}

export function classifyDriveError(rawError: unknown): ClassifiedDriveError {
  const msg = rawError instanceof Error ? rawError.message : String(rawError || "");

  // 1. Google Drive API not enabled in Google Cloud Console
  if (
    msg.includes("Google Drive API has not been used") ||
    msg.includes("SERVICE_DISABLED") ||
    msg.includes("accessNotConfigured") ||
    msg.includes("has not been used in project")
  ) {
    // Try to extract project ID if present
    const projectMatch = msg.match(/project[ =](\d+)/i) || msg.match(/projects\/(\d+)/i);
    const projectId = projectMatch ? projectMatch[1] : "";
    const consoleUrl = projectId
      ? `https://console.cloud.google.com/apis/library/drive.googleapis.com?project=${projectId}`
      : "https://console.cloud.google.com/apis/library/drive.googleapis.com";

    return {
      code: "DRIVE_API_NOT_ENABLED",
      userMessage: "Google Drive API chưa được bật trên Google Cloud Console",
      detail: msg,
      actionUrl: consoleUrl,
      actionType: "enable_api",
    };
  }

  // 2. Insufficient permissions / scopes
  if (
    msg.includes("insufficientPermissions") ||
    msg.includes("insufficient authentication scopes") ||
    msg.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT")
  ) {
    return {
      code: "INSUFFICIENT_PERMISSIONS",
      userMessage: "Chưa cấp quyền truy cập Drive khi đăng nhập Google",
      detail: msg,
      actionType: "relogin",
    };
  }

  // 3. Auth expired or unauthenticated
  if (
    msg.includes("401") ||
    msg.includes("UNAUTHENTICATED") ||
    msg.includes("Invalid Credentials") ||
    msg.includes("invalid_grant") ||
    msg.includes("missing Google access token") ||
    msg.includes("RefreshTokenError") ||
    msg.includes("Unauthorized")
  ) {
    return {
      code: "AUTH_EXPIRED",
      userMessage: "Phiên đăng nhập Google đã hết hạn hoặc không hợp lệ",
      detail: msg,
      actionType: "relogin",
    };
  }

  // 4. Default / Network error
  return {
    code: "NETWORK_ERROR",
    userMessage: "Lỗi kết nối tới máy chủ Google Drive",
    detail: msg,
    actionType: "retry",
  };
}
