"use client";

import * as React from "react";
import { syncEngine } from "@/lib/drive/sync-engine";
import { SyncStatusInfo } from "@/types/drive";
import { CloudCheck, CloudOff, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function SyncStatusIndicator() {
  const [status, setStatus] = React.useState<SyncStatusInfo>(() =>
    syncEngine.getStatus()
  );

  React.useEffect(() => {
    const unsubscribe = syncEngine.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const handleRetry = () => {
    syncEngine.performSync();
  };

  if (status.state === "syncing") {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 font-medium select-none">
        <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
        <span className="truncate">Đang đồng bộ...</span>
      </div>
    );
  }

  if (status.state === "offline") {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium select-none">
        <CloudOff className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">Offline</span>
      </div>
    );
  }

  if (status.state === "error") {
    return (
      <button
        onClick={handleRetry}
        className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium hover:underline select-none"
        title="Bấm để thử lại"
      >
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">Lỗi - thử lại</span>
      </button>
    );
  }

  // Synced
  return (
    <button
      onClick={() => syncEngine.performSync()}
      className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 select-none transition-colors"
      title="Bấm để đồng bộ ngay"
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <span className="truncate">Đã đồng bộ</span>
    </button>
  );
}
