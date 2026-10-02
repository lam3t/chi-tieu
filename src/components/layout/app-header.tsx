"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { CloudCheck, CloudOff, RefreshCw, AlertCircle, Heart } from "lucide-react";
import { SyncStatusIndicator } from "./sync-status-indicator";

const TITLE_MAP: Record<string, string> = {
  "/": "Quản lý Chi tiêu",
  "/transactions": "Lịch sử Giao dịch",
  "/cycle": "Chu kỳ & Thụ thai",
  "/analytics": "Báo cáo & Phân tích",
  "/categories": "Quản lý Hạng mục",
  "/settings": "Cài đặt Hệ thống",
};

export function AppHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (pathname === "/login") return null;

  const title = TITLE_MAP[pathname] || "Chi tiêu Cá nhân";
  const isCyclePage = pathname === "/cycle";

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 pt-safe">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm transition-all ${
              isCyclePage
                ? "bg-gradient-to-tr from-rose-500 to-pink-500 shadow-rose-500/20"
                : "bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20"
            }`}
          >
            {isCyclePage ? "🌸" : "₫"}
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
          {!isCyclePage && (
            <Link
              href="/cycle"
              title="Theo dõi chu kỳ kinh nguyệt"
              className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-xs transition-colors"
            >
              <span className="text-xs">🌸</span>
            </Link>
          )}

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
