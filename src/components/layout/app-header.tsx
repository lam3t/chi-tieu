"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { CloudCheck, CloudOff, RefreshCw, AlertCircle } from "lucide-react";
import { SyncStatusIndicator } from "./sync-status-indicator";

const TITLE_MAP: Record<string, string> = {
  "/": "Quản lý Chi tiêu",
  "/transactions": "Lịch sử Giao dịch",
  "/analytics": "Báo cáo & Phân tích",
  "/categories": "Quản lý Hạng mục",
  "/settings": "Cài đặt Hệ thống",
};

export function AppHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (pathname === "/login") return null;

  const title = TITLE_MAP[pathname] || "Chi tiêu Cá nhân";

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 pt-safe">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-emerald-500/20">
            ₫
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
              {title}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <SyncStatusIndicator />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session?.user?.image ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300">
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
