"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ReceiptText, BarChart3, Tags, Settings, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/transactions", label: "Sổ GD", icon: ReceiptText },
  { href: "/cycle", label: "Chu kỳ", icon: Heart },
  { href: "/analytics", label: "Phân tích", icon: BarChart3 },
  { href: "/categories", label: "Hạng mục", icon: Tags },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on login page
  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors select-none",
                isActive
                  ? item.href === "/cycle"
                    ? "text-rose-600 dark:text-rose-400 font-semibold"
                    : "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-xl transition-all",
                  isActive &&
                    (item.href === "/cycle"
                      ? "bg-rose-50 dark:bg-rose-950/50"
                      : "bg-emerald-50 dark:bg-emerald-950/50")
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.2]" : "stroke-[1.7]")} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
