"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Droplet,
  Sparkles,
  Info,
  Calendar as CalendarIcon,
  CheckCircle2,
} from "lucide-react";
import {
  calculateDayCycleInfo,
  formatDateString,
  parseDateString,
} from "@/lib/cycle/calculator";
import { DayCycleInfo } from "@/types/cycle";
import { Button } from "@/components/ui/button";

interface CycleCalendarProps {
  cycleStartDate: string;
  cycleLength: number;
  periodLength: number;
  lutealPhase: number;
  onSelectDateAsNewPeriodStart: (dateStr: string) => void;
}

export function CycleCalendar({
  cycleStartDate,
  cycleLength,
  periodLength,
  lutealPhase,
  onSelectDateAsNewPeriodStart,
}: CycleCalendarProps) {
  const todayStr = React.useMemo(() => formatDateString(new Date()), []);
  const [currentViewMonth, setCurrentViewMonth] = React.useState<Date>(() => {
    return new Date();
  });

  const [selectedDateStr, setSelectedDateStr] = React.useState<string>(todayStr);

  // Month navigation
  const prevMonth = () => {
    setCurrentViewMonth(
      new Date(currentViewMonth.getFullYear(), currentViewMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentViewMonth(
      new Date(currentViewMonth.getFullYear(), currentViewMonth.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentViewMonth(new Date());
    setSelectedDateStr(todayStr);
  };

  // Build calendar matrix
  const calendarDays = React.useMemo(() => {
    const year = currentViewMonth.getFullYear();
    const month = currentViewMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Day of week for 1st: 0=Sun, 1=Mon, ..., 6=Sat
    // Convert to Monday=0, ..., Sunday=6
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];

    // Days from previous month for padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const dStr = formatDateString(d);
      const info = calculateDayCycleInfo(
        dStr,
        cycleStartDate,
        cycleLength,
        periodLength,
        lutealPhase
      );
      days.push({ date: d, dateStr: dStr, isCurrentMonth: false, info });
    }

    // Days of current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      const dStr = formatDateString(d);
      const info = calculateDayCycleInfo(
        dStr,
        cycleStartDate,
        cycleLength,
        periodLength,
        lutealPhase
      );
      days.push({ date: d, dateStr: dStr, isCurrentMonth: true, info });
    }

    // Days of next month for completing the grid (6 rows = 42 cells or full weeks)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        const dStr = formatDateString(d);
        const info = calculateDayCycleInfo(
          dStr,
          cycleStartDate,
          cycleLength,
          periodLength,
          lutealPhase
        );
        days.push({ date: d, dateStr: dStr, isCurrentMonth: false, info });
      }
    }

    return days;
  }, [currentViewMonth, cycleStartDate, cycleLength, periodLength, lutealPhase]);

  // Selected date info
  const selectedInfo: DayCycleInfo = React.useMemo(() => {
    return calculateDayCycleInfo(
      selectedDateStr,
      cycleStartDate,
      cycleLength,
      periodLength,
      lutealPhase
    );
  }, [selectedDateStr, cycleStartDate, cycleLength, periodLength, lutealPhase]);

  const monthTitle = `Tháng ${currentViewMonth.getMonth() + 1}, ${currentViewMonth.getFullYear()}`;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-rose-500" />
            {monthTitle}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Chạm vào một ngày để xem khả năng thụ thai
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
          >
            Hôm nay
          </button>
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 tracking-tight">
        <span>T2</span>
        <span>T3</span>
        <span>T4</span>
        <span>T5</span>
        <span>T6</span>
        <span>T7</span>
        <span className="text-rose-400">CN</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell) => {
          const isSelected = cell.dateStr === selectedDateStr;
          const isToday = cell.dateStr === todayStr;
          const { isMenstruation, isOvulation, isFertileWindow } = cell.info;

          // Determine cell styling
          let markerColor = "";
          if (isMenstruation) {
            markerColor = "bg-rose-500";
          } else if (isOvulation) {
            markerColor = "bg-purple-600";
          } else if (isFertileWindow) {
            markerColor = "bg-pink-400";
          }

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => setSelectedDateStr(cell.dateStr)}
              className={`relative flex flex-col items-center justify-center h-10 rounded-xl transition-all select-none ${
                !cell.isCurrentMonth
                  ? "opacity-30 text-slate-400"
                  : "text-slate-800 dark:text-slate-200"
              } ${
                isSelected
                  ? "ring-2 ring-rose-500 font-bold bg-rose-50/80 dark:bg-rose-950/60"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800"
              } ${
                isToday && !isSelected
                  ? "border border-rose-300 dark:border-rose-700 font-bold"
                  : ""
              }`}
            >
              <span className="text-xs">{cell.date.getDate()}</span>

              {/* Day indicator dot or icon */}
              {isOvulation ? (
                <span className="text-[10px] leading-none absolute bottom-0.5 text-purple-600">
                  🌸
                </span>
              ) : markerColor ? (
                <span
                  className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${markerColor}`}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Calendar Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
          <span>Hành kinh</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-400 inline-block" />
          <span>Cửa sổ thụ thai</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>🌸</span>
          <span>Ngày rụng trứng</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" />
          <span>An toàn</span>
        </div>
      </div>

      {/* Selected Day Detail Panel */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-rose-50/30 dark:from-slate-800/80 dark:to-rose-950/20 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {selectedDateStr} (Ngày {selectedInfo.dayOfCycle}/{cycleLength})
            </span>
            {selectedInfo.isToday && (
              <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-bold">
                Hôm nay
              </span>
            )}
          </div>

          <div
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              selectedInfo.fertilityLevel === "PEAK"
                ? "bg-rose-500 text-white"
                : selectedInfo.fertilityLevel === "HIGH"
                ? "bg-pink-500 text-white"
                : selectedInfo.fertilityLevel === "MEDIUM"
                ? "bg-amber-500 text-white"
                : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            Thụ thai: {selectedInfo.fertilityPercentage}%
          </div>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            {selectedInfo.phaseLabel}
          </p>
          <p className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
            {selectedInfo.description}
          </p>
          <p className="text-[11px] mt-1 italic text-slate-600 dark:text-slate-300">
            💡 {selectedInfo.advice}
          </p>
        </div>

        {/* Action to set selected date as new cycle start date */}
        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectDateAsNewPeriodStart(selectedDateStr)}
            className="w-full text-xs h-9 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
          >
            <Droplet className="w-3.5 h-3.5 mr-1.5 fill-rose-500 text-rose-500" />
            Đánh dấu kỳ kinh bắt đầu vào ngày {selectedDateStr}
          </Button>
        </div>
      </div>
    </div>
  );
}
