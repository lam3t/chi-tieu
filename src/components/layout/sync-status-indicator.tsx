"use client";

import * as React from "react";
import { syncEngine } from "@/lib/drive/sync-engine";
import { SyncStatusInfo } from "@/types/drive";
import {
  CloudOff,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp,
  LogIn,
  CheckCircle2,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export function SyncStatusIndicator() {
  const [status, setStatus] = React.useState<SyncStatusInfo>(() =>
    syncEngine.getStatus()
  );
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const unsubscribe = syncEngine.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    toast({ title: "Đang kiểm tra & đồng bộ...", type: "info" });
    const res = await syncEngine.performSync();
    if (res.success) {
      toast({ title: "Đã đồng bộ với Google Drive", type: "success" });
    } else {
      setIsModalOpen(true);
    }
  };

  const handleRetryInModal = async () => {
    setIsRetrying(true);
    const res = await syncEngine.performSync({ forcePull: true });
    setIsRetrying(false);

    if (res.success) {
      toast({
        title: "Đồng bộ thành công!",
        description: "Dữ liệu đã kết nối an toàn với Google Drive cá nhân.",
        type: "success",
      });
      setIsModalOpen(false);
    } else {
      toast({
        title: "Chưa thể kết nối",
        description: res.message || "Vui lòng xem hướng dẫn bên dưới",
        type: "error",
      });
    }
  };

  const handleReLogin = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {/* 1. Header Mini Indicator */}
      {status.state === "syncing" && (
        <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 font-medium select-none">
          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span className="truncate">Đang đồng bộ...</span>
        </div>
      )}

      {status.state === "offline" && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium select-none">
          <CloudOff className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Offline</span>
        </div>
      )}

      {status.state === "error" && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold hover:underline select-none animate-pulse"
          title="Nhấn để xem chi tiết lỗi và cách khắc phục"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Lỗi - thử lại</span>
        </button>
      )}

      {status.state === "synced" && (
        <button
          onClick={handleManualSync}
          className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 select-none transition-colors"
          title="Bấm để đồng bộ ngay"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="truncate">Đã đồng bộ</span>
        </button>
      )}

      {/* 2. Interactive Error Diagnostic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Sự cố đồng bộ Google Drive
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {status.errorCode === "DRIVE_API_NOT_ENABLED"
                      ? "Chưa bật Drive API trên Google Cloud"
                      : status.errorCode === "AUTH_EXPIRED"
                      ? "Phiên đăng nhập hết hạn"
                      : "Không thể kết nối Drive"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanatory Body */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 space-y-2.5 text-xs">
              {status.errorCode === "DRIVE_API_NOT_ENABLED" ? (
                <>
                  <p className="font-semibold text-rose-700 dark:text-rose-400 text-xs">
                    Nguyên nhân: Google Drive API chưa được kích hoạt
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    Google Cloud yêu cầu phải bấm <strong>Enable</strong> (Bật) thư viện Google Drive API cho dự án của bạn thì ứng dụng mới có thể lưu file:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300 pl-1">
                    <li>Bấm nút <strong>Mở Google Cloud Console</strong> bên dưới.</li>
                    <li>Nhấn nút màu xanh <strong>ENABLE</strong> (Bật API).</li>
                    <li>Đợi 1 phút để Google áp dụng rồi bấm <strong>Thử lại ngay</strong>.</li>
                  </ol>
                  {status.actionUrl && (
                    <a
                      href={status.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Mở Google Cloud Console để Bật API
                    </a>
                  )}
                </>
              ) : status.errorCode === "AUTH_EXPIRED" || status.errorCode === "INSUFFICIENT_PERMISSIONS" ? (
                <>
                  <p className="font-semibold text-amber-700 dark:text-amber-400 text-xs">
                    Phiên xác thực Google cần làm mới
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    Mã truy cập Google Drive của bạn đã hết hạn hoặc chưa được cấp quyền appDataFolder. Vui lòng đăng nhập lại.
                  </p>
                  <Button
                    onClick={handleReLogin}
                    size="sm"
                    className="w-full mt-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  >
                    <LogIn className="w-3.5 h-3.5 mr-1.5" />
                    Đăng xuất & Đăng nhập lại Google
                  </Button>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                    {status.message || "Lỗi đồng bộ dữ liệu"}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Vui lòng kiểm tra kết nối mạng và tài khoản Google của bạn rồi nhấn thử lại.
                  </p>
                </>
              )}

              {/* Technical detail toggle */}
              {status.errorDetail && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center justify-between w-full text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <span>Chi tiết lỗi kỹ thuật</span>
                    {showDetails ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                  {showDetails && (
                    <pre className="mt-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-[9px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-24">
                      {status.errorDetail}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 text-xs"
              >
                Đóng
              </Button>
              <Button
                onClick={handleRetryInModal}
                disabled={isRetrying}
                size="sm"
                className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <RefreshCw
                  className={cn("w-3.5 h-3.5 mr-1.5", isRetrying && "animate-spin")}
                />
                {isRetrying ? "Đang thử..." : "Thử lại ngay"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

