"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Settings } from "@/types/models";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { formatVND, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/components/providers/theme-provider";
import { syncEngine } from "@/lib/drive/sync-engine";
import { SyncStatusInfo } from "@/types/drive";
import { exportTransactionsCSV, exportAllJSON } from "@/lib/export";
import { signOut, useSession } from "next-auth/react";
import {
  Settings as SettingsIcon,
  LogOut,
  HardDrive,
  Shield,
  RefreshCw,
  DownloadCloud,
  FileSpreadsheet,
  FileJson,
  Trash2,
  Moon,
  Sun,
  Laptop,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  PiggyBank,
  Calendar,
  Save,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  // Load settings from Dexie with localStorage fallback
  const settingsRec = useLiveQuery(() => db.settings.get("app_settings"), []);
  const [localSettings, setLocalSettings] = React.useState<Settings>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("app_settings");
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return DEFAULT_SETTINGS;
  });

  const settings: Settings = settingsRec?.value || localSettings || DEFAULT_SETTINGS;

  const transactions = useLiveQuery(() => db.transactions.toArray(), []);
  const categories = useLiveQuery(() => db.categories.toArray(), []);

  // Form states
  const [monthStartDay, setMonthStartDay] = React.useState(1);
  const [emergencyTarget, setEmergencyTarget] = React.useState("50000000");
  const [saveReceipts, setSaveReceipts] = React.useState(false);

  // Sync state
  const [syncStatus, setSyncStatus] = React.useState<SyncStatusInfo>(() =>
    syncEngine.getStatus()
  );

  // Modal confirm delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (settings) {
      setMonthStartDay(settings.monthStartDay || 1);
      setEmergencyTarget((settings.emergencyFundTarget || 50000000).toString());
      setSaveReceipts(settings.saveReceiptImages || false);
    }
  }, [settingsRec, localSettings]);

  React.useEffect(() => {
    return syncEngine.subscribe((newStatus) => {
      setSyncStatus(newStatus);
    });
  }, []);

  const handleSaveSettings = async () => {
    const updated: Settings = {
      ...settings,
      monthStartDay: Math.min(28, Math.max(1, monthStartDay)),
      emergencyFundTarget: parseInt(emergencyTarget, 10) || 0,
      saveReceiptImages: saveReceipts,
      updatedAt: new Date().toISOString(),
    };

    setLocalSettings(updated);

    // Save to localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("app_settings", JSON.stringify(updated));
      } catch {}
    }

    try {
      await db.ensureOpen();
      await db.settings.put({
        key: "app_settings",
        value: updated,
      });

      await db.enqueueSyncJob("meta");

      toast({
        title: "Đã lưu cài đặt",
        type: "success",
      });
    } catch (e: unknown) {
      console.warn("IndexedDB warning, saved to localStorage:", e);
      toast({
        title: "Đã lưu cài đặt",
        description: "Cấu hình đã được ghi nhớ trên thiết bị",
        type: "success",
      });
    }
  };

  const handleManualSync = async () => {
    toast({ title: "Đang đồng bộ dữ liệu...", type: "info" });
    const res = await syncEngine.performSync();
    if (res.success) {
      toast({ title: "Hoàn tất đồng bộ với Google Drive", type: "success" });
    } else {
      toast({
        title: "Đồng bộ không thành công",
        description: res.message || "Vui lòng xem chi tiết bên dưới",
        type: "error",
      });
    }
  };

  const handleForcePull = async () => {
    toast({ title: "Đang tải dữ liệu từ Google Drive...", type: "info" });
    const res = await syncEngine.performSync({ forcePull: true });
    if (res.success) {
      toast({ title: "Đã tải toàn bộ dữ liệu từ Drive về máy", type: "success" });
    } else {
      toast({
        title: "Tải từ Drive không thành công",
        description: res.message || "Vui lòng xem chi tiết bên dưới",
        type: "error",
      });
    }
  };

  const handleExportCSV = () => {
    if (!transactions || !categories) return;
    exportTransactionsCSV(transactions, categories);
    toast({ title: "Đã xuất file Excel / CSV", type: "success" });
  };

  const handleExportJSON = () => {
    if (!transactions || !categories) return;
    exportAllJSON(transactions, categories, settings);
    toast({ title: "Đã tải bản sao lưu JSON", type: "success" });
  };

  const handleDeleteAllData = async () => {
    try {
      await db.transactions.clear();
      await db.syncQueue.clear();
      setIsDeleteModalOpen(false);
      toast({
        title: "Đã xóa toàn bộ dữ liệu trên thiết bị",
        type: "info",
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Account Card */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            Tài Khoản Người Dùng
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-1 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <div className="min-w-0 pr-2">
              <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                {session?.user?.name || "Người dùng Google"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {session?.user?.email || "Chưa đăng nhập"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/40 h-8"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Đăng xuất
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Google Drive Sync Section */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              Đồng Bộ Google Drive AppData
            </CardTitle>
            <span
              className={cn(
                "text-[10px] font-mono px-2 py-0.5 rounded-full font-medium truncate max-w-[200px]",
                syncStatus.state === "error"
                  ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 font-semibold"
                  : syncStatus.state === "syncing"
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60"
                  : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60"
              )}
            >
              {syncStatus.message || "Sẵn sàng"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-1 space-y-3 text-xs">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Dữ liệu tự động đồng bộ lên thư mục `appDataFolder` riêng tư trên Google Drive của bạn. Chỉ có bạn mới có quyền truy cập.
          </p>

          {syncStatus.state === "error" && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2">
              <div className="flex items-start gap-2 text-rose-700 dark:text-rose-400 font-semibold text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p>{syncStatus.message || "Gặp sự cố khi kết nối Drive"}</p>
                </div>
              </div>

              {syncStatus.errorCode === "DRIVE_API_NOT_ENABLED" && (
                <div className="space-y-1.5 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <p className="leading-snug">
                    Dự án Google Cloud của bạn chưa bật <strong>Google Drive API</strong>.
                  </p>
                  <a
                    href={syncStatus.actionUrl || "https://console.cloud.google.com/apis/library/drive.googleapis.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] shadow-sm transition-colors mt-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Mở Google Cloud Console để Bật Drive API
                  </a>
                </div>
              )}

              {syncStatus.errorDetail && (
                <pre className="p-2 rounded-lg bg-white/80 dark:bg-black/40 text-[9px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap max-h-20">
                  {syncStatus.errorDetail}
                </pre>
              )}
            </div>
          )}

          {syncStatus.lastSyncedAt && (
            <p className="text-[10px] text-slate-400">
              Lần đồng bộ gần nhất: {new Date(syncStatus.lastSyncedAt).toLocaleTimeString("vi-VN")} - {new Date(syncStatus.lastSyncedAt).toLocaleDateString("vi-VN")}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSync}
              disabled={syncStatus.state === "syncing"}
              className="flex-1 text-xs h-9"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", syncStatus.state === "syncing" && "animate-spin")} />
              Đồng bộ ngay
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleForcePull}
              disabled={syncStatus.state === "syncing"}
              className="flex-1 text-xs h-9"
            >
              <DownloadCloud className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Tải từ Drive
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Theme & Preferences */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-bold flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-emerald-600" />
            Tùy Chỉnh Giao Diện & Quy Tắc
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-1 space-y-4 text-xs">
          {/* Theme Selection */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 mb-1.5 block">
              Giao diện (Theme)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTheme("light")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all",
                  theme === "light"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 font-semibold"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                )}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Sáng</span>
              </button>

              <button
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all",
                  theme === "dark"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-400 font-semibold"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                )}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tối</span>
              </button>

              <button
                onClick={() => setTheme("system")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all",
                  theme === "system"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 font-semibold"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                )}
              >
                <Laptop className="w-3.5 h-3.5 text-slate-500" />
                <span>Hệ thống</span>
              </button>
            </div>
          </div>

          {/* Month Start Day */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Ngày bắt đầu chu kỳ tháng
              </label>
              <span className="font-mono text-emerald-600 font-semibold">
                Ngày {monthStartDay} hàng tháng
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="28"
              value={monthStartDay}
              onChange={(e) => setMonthStartDay(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Phù hợp cho chu kỳ lương (ví dụ ngày nhận lương là ngày 1, 5 hoặc 10).
            </p>
          </div>

          {/* Emergency Fund Target */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
              <PiggyBank className="w-3.5 h-3.5" />
              Mục tiêu Quỹ khẩn cấp (VND)
            </label>
            <input
              type="number"
              step="1000000"
              value={emergencyTarget}
              onChange={(e) => setEmergencyTarget(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs outline-hidden"
            />
            <p className="text-[10px] text-emerald-600 font-mono mt-0.5">
              Mục tiêu: {formatVND(parseInt(emergencyTarget, 10) || 0)}
            </p>
          </div>

          {/* Save Receipt Images Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                Lưu ảnh hóa đơn lên Google Drive
              </p>
              <p className="text-[10px] text-slate-400">
                Tự động lưu ảnh hóa đơn nén vào thư mục `receipts/` trên Drive
              </p>
            </div>
            <input
              type="checkbox"
              checked={saveReceipts}
              onChange={(e) => setSaveReceipts(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <Button
            onClick={handleSaveSettings}
            className="w-full text-xs h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Lưu thay đổi cài đặt
          </Button>
        </CardContent>
      </Card>

      {/* 4. Export & Backup Section */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Xuất Dữ Liệu & Sao Lưu
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-1 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-10 text-xs flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Xuất Excel / CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJSON}
              className="h-10 text-xs flex items-center gap-1.5"
            >
              <FileJson className="w-4 h-4 text-blue-600" />
              <span>Sao lưu JSON</span>
            </Button>
          </div>
          <p className="text-[10px] text-slate-400">
            File CSV được mã hóa UTF-8 BOM hiển thị chuẩn tiếng Việt có dấu trên Microsoft Excel.
          </p>
        </CardContent>
      </Card>

      {/* 5. Danger Zone */}
      <Card className="border-rose-200 dark:border-rose-950">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-bold flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-4 h-4" />
            Vùng Nguy Hiểm
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-1 space-y-2 text-xs">
          <p className="text-[11px] text-slate-500">
            Xóa sạch toàn bộ giao dịch đang lưu trên thiết bị này. Dữ liệu trên Google Drive chỉ thay đổi khi bạn đồng bộ tiếp theo.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full text-xs h-9 bg-rose-600 hover:bg-rose-700"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Xóa toàn bộ dữ liệu trên máy
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-rose-200 dark:border-rose-900 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold">Xác nhận xóa dữ liệu?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Hành động này sẽ xóa toàn bộ danh sách giao dịch trong IndexedDB trên thiết bị. Bạn có chắc chắn muốn tiếp tục?
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                className="flex-1 text-xs bg-rose-600"
                onClick={handleDeleteAllData}
              >
                Đồng ý xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
