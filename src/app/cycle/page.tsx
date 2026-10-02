"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  calculateCycleResult,
  calculateAverageCycleLength,
  formatDateString,
} from "@/lib/cycle/calculator";
import { CycleHeroCard } from "@/components/cycle/cycle-hero-card";
import { CycleCalendar } from "@/components/cycle/cycle-calendar";
import { ConceptionChart } from "@/components/cycle/conception-chart";
import { CycleSetupModal } from "@/components/cycle/cycle-setup-modal";
import { CycleHistoryModal } from "@/components/cycle/cycle-history-modal";
import { SymptomsSheet } from "@/components/cycle/symptoms-sheet";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Settings as SettingsIcon,
  Heart,
  Droplet,
  History,
  CalendarDays,
  Smile,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function CycleTrackerPage() {
  const { toast } = useToast();
  const todayStr = React.useMemo(() => formatDateString(new Date()), []);

  // Dexie live queries
  const settings = useLiveQuery(() => db.getMenstrualSettings());
  const logs = useLiveQuery(() => db.getAllPeriodLogs());

  // Modals state
  const [isSetupOpen, setIsSetupOpen] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [isSymptomsOpen, setIsSymptomsOpen] = React.useState(false);

  // If loading from IndexedDB
  if (settings === undefined || logs === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
      </div>
    );
  }

  // If no logs or not set up
  if (!settings.setupCompleted || logs.length === 0) {
    return (
      <div className="space-y-6 pt-6 pb-12">
        <div className="text-center max-w-sm mx-auto space-y-4">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/25">
            <Heart className="w-10 h-10 fill-white/20 stroke-[1.8]" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Theo dõi Chu kỳ Kinh nguyệt
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Khai báo ngày bắt đầu và độ dài chu kỳ. Hệ thống sẽ tự động tính toán ngày rụng trứng, thời điểm vàng và xác suất mang thai (%) mỗi ngày.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-left space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 font-semibold text-rose-700 dark:text-rose-300">
              <Sparkles className="w-4 h-4" />
              <span>Các tính năng tự động:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              <li>Xác suất mang thai (%) cập nhật theo từng ngày</li>
              <li>Dự báo ngày rụng trứng & cửa sổ thụ thai</li>
              <li>Tự động điều chỉnh khi bạn cập nhật ngày kinh mới</li>
              <li>Lịch sinh học tương tác & biểu đồ khoa học</li>
            </ul>
          </div>

          <Button
            onClick={() => setIsSetupOpen(true)}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold shadow-lg shadow-rose-600/30 active:scale-98"
          >
            Khai báo thông tin ban đầu
          </Button>
        </div>

        <CycleSetupModal
          isOpen={isSetupOpen}
          onClose={() => setIsSetupOpen(false)}
          isInitialOnboarding={true}
        />
      </div>
    );
  }

  // Latest cycle log
  const latestLog = logs[0];
  const avgCycleLength = calculateAverageCycleLength(logs, settings.cycleLength);

  const calculation = calculateCycleResult(
    latestLog.startDate,
    avgCycleLength,
    settings.periodLength,
    settings.lutealPhase,
    todayStr
  );

  // Quick Action: Today is new period start date
  const handleLogNewPeriodToday = async () => {
    try {
      await db.logNewPeriod(todayStr, { periodDays: settings.periodLength });
      toast({
        title: "Đã cập nhật kỳ kinh mới hôm nay!",
        description: `Hệ thống đã tính toán lại chu kỳ bắt đầu từ ngày ${todayStr}`,
        type: "success",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Không thể lưu kỳ kinh mới",
        type: "error",
      });
    }
  };

  // Select date from calendar to set as period start
  const handleSelectDateAsNewPeriodStart = async (dateStr: string) => {
    try {
      await db.logNewPeriod(dateStr, { periodDays: settings.periodLength });
      toast({
        title: "Đã cập nhật ngày kinh nguyệt!",
        description: `Chu kỳ mới đã được tính từ ngày ${dateStr}`,
        type: "success",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật ngày kinh",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Top action row */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>Theo dõi Chu kỳ</span>
            <span className="text-rose-500">🌸</span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Dựa trên ngày bắt đầu gần nhất: {latestLog.startDate}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSymptomsOpen(true)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Ghi nhận triệu chứng"
          >
            <Smile className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Lịch sử các kỳ kinh"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsSetupOpen(true)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Cài đặt chu kỳ"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Hero Card: Cycle dial, conception % meter, advice, countdowns, quick buttons */}
      <CycleHeroCard
        calculation={calculation}
        onLogNewPeriodToday={handleLogNewPeriodToday}
        onOpenEditModal={() => setIsHistoryOpen(true)}
        onOpenSymptoms={() => setIsSymptomsOpen(true)}
      />

      {/* 2. Interactive Calendar: Menstruation, fertile window, ovulation markers, tap for % */}
      <CycleCalendar
        cycleStartDate={latestLog.startDate}
        cycleLength={avgCycleLength}
        periodLength={settings.periodLength}
        lutealPhase={settings.lutealPhase}
        onSelectDateAsNewPeriodStart={handleSelectDateAsNewPeriodStart}
      />

      {/* 3. Conception Probability Curve Chart */}
      <ConceptionChart
        cycleStartDate={latestLog.startDate}
        cycleLength={avgCycleLength}
        periodLength={settings.periodLength}
        lutealPhase={settings.lutealPhase}
        currentCycleDay={calculation.currentCycleDay}
      />

      {/* 4. Bottom quick links */}
      <div className="grid grid-cols-2 gap-2.5">
        <Button
          variant="outline"
          onClick={() => setIsHistoryOpen(true)}
          className="h-11 rounded-2xl border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          <CalendarDays className="w-4 h-4 text-rose-500" />
          <span>Lịch sử & Dự báo</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => setIsSymptomsOpen(true)}
          className="h-11 rounded-2xl border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          <Smile className="w-4 h-4 text-purple-500" />
          <span>Nhật ký triệu chứng</span>
        </Button>
      </div>

      {/* Modals */}
      <CycleSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        initialStartDate={latestLog.startDate}
        initialCycleLength={settings.cycleLength}
        initialPeriodLength={settings.periodLength}
      />

      <CycleHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        logs={logs}
        calculation={calculation}
        onRefresh={() => {}}
      />

      <SymptomsSheet
        isOpen={isSymptomsOpen}
        onClose={() => setIsSymptomsOpen(false)}
        selectedDate={todayStr}
      />
    </div>
  );
}
