"use client";

import * as React from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  calculateCycleResult,
  calculateAverageCycleLength,
  formatDateString,
} from "@/lib/cycle/calculator";
import { Sparkles, Heart, ChevronRight, Droplet, PlusCircle } from "lucide-react";
import { CycleSetupModal } from "./cycle-setup-modal";

export function CycleDashboardWidget() {
  const [isSetupOpen, setIsSetupOpen] = React.useState(false);
  const todayStr = React.useMemo(() => formatDateString(new Date()), []);

  const settings = useLiveQuery(() => db.getMenstrualSettings());
  const logs = useLiveQuery(() => db.getAllPeriodLogs());

  if (!settings || !logs) return null;

  // Not set up yet
  if (!settings.setupCompleted || logs.length === 0) {
    return (
      <>
        <div
          onClick={() => setIsSetupOpen(true)}
          className="cursor-pointer group relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-purple-500/10 dark:from-rose-950/40 dark:via-pink-950/40 dark:to-purple-950/40 border border-rose-200/80 dark:border-rose-800/60 p-4 transition-all hover:shadow-md hover:border-rose-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-sm shadow-rose-500/30">
                <Heart className="w-5 h-5 fill-white/30" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                  Theo dõi Chu kỳ & Khả năng Thụ thai (%)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Khai báo ngày bắt đầu để tự động tính rụng trứng & ngày an toàn
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl shadow-xs border border-rose-100 dark:border-rose-900">
              <span>Bắt đầu</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        <CycleSetupModal
          isOpen={isSetupOpen}
          onClose={() => setIsSetupOpen(false)}
          isInitialOnboarding={true}
        />
      </>
    );
  }

  // Calculate based on latest log
  const latestLog = logs[0];
  const avgCycle = calculateAverageCycleLength(logs, settings.cycleLength);
  const calculation = calculateCycleResult(
    latestLog.startDate,
    avgCycle,
    settings.periodLength,
    settings.lutealPhase,
    todayStr
  );

  const { currentCycleDay, totalCycleLength, todayInfo, daysUntilNextPeriod, isPeriodLate, lateDays } =
    calculation;

  return (
    <Link
      href="/cycle"
      className="block group relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-50 via-pink-50/50 to-purple-50/40 dark:from-rose-950/30 dark:via-pink-950/20 dark:to-purple-950/30 border border-rose-200/80 dark:border-rose-900/60 p-3.5 transition-all hover:shadow-md hover:border-rose-300 select-none"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-rose-500/20">
            {todayInfo.isMenstruation ? (
              <Droplet className="w-5 h-5 fill-white" />
            ) : todayInfo.isOvulation ? (
              <span className="text-base">🌸</span>
            ) : (
              <span>N{currentCycleDay}</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Chu kỳ: Ngày {currentCycleDay}/{totalCycleLength}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                  todayInfo.fertilityLevel === "PEAK"
                    ? "bg-rose-500 text-white"
                    : todayInfo.fertilityLevel === "HIGH"
                    ? "bg-pink-500 text-white"
                    : todayInfo.fertilityLevel === "MEDIUM"
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                }`}
              >
                Thụ thai: {todayInfo.fertilityPercentage}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isPeriodLate
                ? `Trễ kinh ${lateDays} ngày`
                : daysUntilNextPeriod === 0
                ? "Kỳ mới dự kiến hôm nay"
                : `Còn ${daysUntilNextPeriod} ngày tới kỳ sau • ${todayInfo.phaseLabel}`}
            </p>
          </div>
        </div>

        <div className="text-rose-500 dark:text-rose-400 group-hover:translate-x-1 transition-transform">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
}
