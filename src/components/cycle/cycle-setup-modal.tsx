"use client";

import * as React from "react";
import { X, Calendar, Heart, Shield, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatDateString } from "@/lib/cycle/calculator";
import { useToast } from "@/components/ui/toast";

interface CycleSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  initialStartDate?: string;
  initialCycleLength?: number;
  initialPeriodLength?: number;
  isInitialOnboarding?: boolean;
}

export function CycleSetupModal({
  isOpen,
  onClose,
  onSaved,
  initialStartDate,
  initialCycleLength = 28,
  initialPeriodLength = 5,
  isInitialOnboarding = false,
}: CycleSetupModalProps) {
  const { toast } = useToast();
  const todayStr = React.useMemo(() => formatDateString(new Date()), []);

  const [startDate, setStartDate] = React.useState<string>(initialStartDate || todayStr);
  const [cycleLength, setCycleLength] = React.useState<number>(initialCycleLength);
  const [periodLength, setPeriodLength] = React.useState<number>(initialPeriodLength);
  const [goal, setGoal] = React.useState<"track" | "conceive" | "avoid">("track");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (initialStartDate) setStartDate(initialStartDate);
    if (initialCycleLength) setCycleLength(initialCycleLength);
    if (initialPeriodLength) setPeriodLength(initialPeriodLength);
  }, [initialStartDate, initialCycleLength, initialPeriodLength, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) {
      toast({ title: "Vui lòng chọn ngày bắt đầu", type: "error" });
      return;
    }

    setLoading(true);
    try {
      // 1. Save or update menstrual settings
      await db.saveMenstrualSettings({
        cycleLength,
        periodLength,
        lutealPhase: 14,
        setupCompleted: true,
        goal,
      });

      // 2. If onboarding or updating, log this as a period start date
      await db.logNewPeriod(startDate, { periodDays: periodLength });

      toast({
        title: isInitialOnboarding ? "Khởi tạo thành công!" : "Đã cập nhật chu kỳ!",
        description: `Hệ thống đã tính toán lại chu kỳ từ ngày ${startDate}`,
        type: "success",
      });

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast({
        title: "Có lỗi xảy ra",
        description: "Không thể lưu thông tin chu kỳ",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Quick date presets
  const setQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setStartDate(formatDateString(d));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isInitialOnboarding ? "Khai báo Chu kỳ Kinh nguyệt" : "Cập nhật Thông tin Chu kỳ"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hệ thống sẽ tự động tính ngày rụng trứng & khả năng mang thai (%)
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Ngày bắt đầu kỳ kinh gần nhất */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ngày bắt đầu kỳ kinh gần nhất (Ngày có kinh đầu tiên)
            </label>
            <div className="relative">
              <input
                type="date"
                required
                max={todayStr}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-12 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Quick date buttons */}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setQuickDate(0)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(1)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                Hôm qua
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(7)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                1 tuần trước
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(14)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                2 tuần trước
              </button>
            </div>
          </div>

          {/* Độ dài chu kỳ */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Độ dài chu kỳ kinh nguyệt
              </span>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                {cycleLength} ngày
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Khoảng cách từ ngày đầu có kinh đến trước ngày đầu có kinh của kỳ tiếp theo (thường 28 ngày)
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={21}
                max={45}
                step={1}
                value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value))}
                className="flex-1 accent-rose-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCycleLength((p) => Math.max(21, p - 1))}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setCycleLength((p) => Math.min(45, p + 1))}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Số ngày hành kinh */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Số ngày hành kinh (Chảy máu)
              </span>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                {periodLength} ngày
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Số ngày ra máu trung bình của mỗi kỳ kinh (thường 4 - 6 ngày)
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={2}
                max={10}
                step={1}
                value={periodLength}
                onChange={(e) => setPeriodLength(Number(e.target.value))}
                className="flex-1 accent-rose-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPeriodLength((p) => Math.max(2, p - 1))}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodLength((p) => Math.min(10, p + 1))}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Mục tiêu theo dõi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Mục tiêu theo dõi chính của bạn
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setGoal("track")}
                className={`p-3 rounded-xl border text-center transition-all ${
                  goal === "track"
                    ? "border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Calendar className="w-5 h-5 mx-auto mb-1 opacity-80" />
                <span className="text-[11px] block">Theo dõi sức khỏe</span>
              </button>

              <button
                type="button"
                onClick={() => setGoal("conceive")}
                className={`p-3 rounded-xl border text-center transition-all ${
                  goal === "conceive"
                    ? "border-pink-500 bg-pink-50/70 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Heart className="w-5 h-5 mx-auto mb-1 text-pink-500" />
                <span className="text-[11px] block">Muốn thụ thai</span>
              </button>

              <button
                type="button"
                onClick={() => setGoal("avoid")}
                className={`p-3 rounded-xl border text-center transition-all ${
                  goal === "avoid"
                    ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Shield className="w-5 h-5 mx-auto mb-1 text-indigo-500" />
                <span className="text-[11px] block">Tránh thai tự nhiên</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold shadow-lg shadow-rose-500/25 active:scale-98"
            >
              {loading ? (
                "Đang tính toán..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  {isInitialOnboarding ? "Lưu và Bắt đầu theo dõi" : "Cập nhật và Tính lại chu kỳ"}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
