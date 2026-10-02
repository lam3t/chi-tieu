"use client";

import * as React from "react";
import {
  Sparkles,
  Calendar,
  AlertCircle,
  Clock,
  Heart,
  ShieldAlert,
  ChevronRight,
  Droplet,
  Edit3,
} from "lucide-react";
import { CycleCalculationResult, FertilityLevel } from "@/types/cycle";
import { Button } from "@/components/ui/button";

interface CycleHeroCardProps {
  calculation: CycleCalculationResult;
  onLogNewPeriodToday: () => void;
  onOpenEditModal: () => void;
  onOpenSymptoms: () => void;
}

export function CycleHeroCard({
  calculation,
  onLogNewPeriodToday,
  onOpenEditModal,
  onOpenSymptoms,
}: CycleHeroCardProps) {
  const {
    currentCycleDay,
    totalCycleLength,
    todayInfo,
    daysUntilNextPeriod,
    daysUntilOvulation,
    isPeriodLate,
    lateDays,
  } = calculation;

  // Percentage progress through the cycle (0 to 100)
  const cycleProgress = Math.min(100, Math.round((currentCycleDay / totalCycleLength) * 100));

  // Determine badge colors based on fertility level
  const getFertilityBadge = (level: FertilityLevel, percentage: number) => {
    switch (level) {
      case "PEAK":
        return {
          bg: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800",
          barColor: "bg-gradient-to-r from-rose-500 to-pink-500",
          text: `Đỉnh điểm (${percentage}%)`,
          subtext: "Thời điểm vàng thụ thai",
        };
      case "HIGH":
        return {
          bg: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-300 dark:border-pink-800",
          barColor: "bg-gradient-to-r from-pink-500 to-rose-400",
          text: `Rất cao (${percentage}%)`,
          subtext: "Cửa sổ thụ thai",
        };
      case "MEDIUM":
        return {
          bg: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800",
          barColor: "bg-amber-500",
          text: `Trung bình (${percentage}%)`,
          subtext: "Nguy cơ thụ thai tăng",
        };
      case "LOW":
        return {
          bg: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800",
          barColor: "bg-blue-500",
          text: `Thấp (${percentage}%)`,
          subtext: "Giai đoạn ít thuận lợi",
        };
      case "VERY_LOW":
      default:
        return {
          bg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800",
          barColor: "bg-emerald-500",
          text: `Rất thấp (${percentage}%)`,
          subtext: "Vùng an toàn tự nhiên",
        };
    }
  };

  const badgeInfo = getFertilityBadge(todayInfo.fertilityLevel, todayInfo.fertilityPercentage);

  return (
    <div className="space-y-3.5">
      {/* Late period alert banner if applicable */}
      {isPeriodLate && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-amber-800 dark:text-amber-300">
              Trễ kinh {lateDays} ngày so với dự kiến
            </p>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5">
              Nếu chu kỳ mới của bạn đã bắt đầu, hãy bấm nút &quot;Báo kỳ mới&quot; bên dưới để hệ thống cập nhật và tính lại toàn bộ ngày rụng trứng.
            </p>
          </div>
        </div>
      )}

      {/* Main Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-600 to-purple-700 text-white p-6 shadow-xl shadow-rose-500/20">
        {/* Subtle decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-black/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Phase Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide uppercase text-white shadow-sm mb-4">
            {todayInfo.isMenstruation && <Droplet className="w-3.5 h-3.5 fill-white" />}
            {todayInfo.isOvulation && <Sparkles className="w-3.5 h-3.5 text-yellow-300" />}
            {todayInfo.phaseLabel}
          </div>

          {/* Circular Day Indicator */}
          <div className="relative w-36 h-36 flex items-center justify-center my-1">
            {/* SVG Ring Progress */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                className="stroke-white/20"
                strokeWidth="7"
                fill="transparent"
              />
              {/* Progress stroke */}
              <circle
                cx="60"
                cy="60"
                r="50"
                className="stroke-white transition-all duration-700 ease-out"
                strokeWidth="7"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 * (1 - cycleProgress / 100)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[11px] font-medium tracking-tight text-white/80">
                NGÀY THỨ
              </span>
              <span className="text-4xl font-extrabold tracking-tight drop-shadow-sm">
                {currentCycleDay}
              </span>
              <span className="text-[11px] font-medium text-white/80">
                / {totalCycleLength} ngày
              </span>
            </div>
          </div>

          {/* Quick status line */}
          <p className="text-sm font-medium text-white/95 mt-2 max-w-xs">
            {todayInfo.description}
          </p>

          {/* Countdown Chips */}
          <div className="grid grid-cols-2 gap-2.5 w-full mt-5">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-2.5 text-left border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                <Clock className="w-3.5 h-3.5" />
                <span>Kỳ tiếp theo</span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5">
                {isPeriodLate
                  ? `Trễ ${lateDays} ngày`
                  : daysUntilNextPeriod === 0
                  ? "Hôm nay!"
                  : `Còn ${daysUntilNextPeriod} ngày`}
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-2.5 text-left border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Rụng trứng</span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5">
                {daysUntilOvulation === 0
                  ? "Hôm nay!"
                  : daysUntilOvulation > 0
                  ? `Còn ${daysUntilOvulation} ngày`
                  : "Đã qua"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pregnancy / Conception Probability Meter Card */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-500">
              <Heart className="w-4 h-4 fill-rose-500/20" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Khả năng mang thai hôm nay
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {badgeInfo.subtext}
              </p>
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-full border text-xs font-extrabold flex items-center gap-1 ${badgeInfo.bg}`}
          >
            <span>{badgeInfo.text}</span>
          </div>
        </div>

        {/* Probability Gauge Bar */}
        <div className="space-y-1">
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${badgeInfo.barColor}`}
              style={{
                width: `${Math.max(4, Math.min(100, (todayInfo.fertilityPercentage / 35) * 100))}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
            <span>Rất thấp (&lt;5%)</span>
            <span>Trung bình (15-25%)</span>
            <span>Đỉnh điểm (35%)</span>
          </div>
        </div>

        {/* Medical Advice Box */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <span className="font-semibold text-slate-900 dark:text-slate-100">Lời khuyên: </span>
          {todayInfo.advice}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <Button
          onClick={onLogNewPeriodToday}
          className="h-12 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold text-xs shadow-md shadow-rose-600/20 active:scale-98 flex items-center justify-center gap-1.5"
        >
          <Droplet className="w-4 h-4 fill-white" />
          <span>Kỳ mới bắt đầu hôm nay</span>
        </Button>

        <Button
          onClick={onOpenEditModal}
          variant="outline"
          className="h-12 rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
        >
          <Edit3 className="w-4 h-4" />
          <span>Điều chỉnh ngày kinh</span>
        </Button>
      </div>
    </div>
  );
}
