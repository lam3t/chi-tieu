"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
} from "recharts";
import { calculateDayCycleInfo, addDays } from "@/lib/cycle/calculator";
import { TrendingUp } from "lucide-react";

interface ConceptionChartProps {
  cycleStartDate: string;
  cycleLength: number;
  periodLength: number;
  lutealPhase: number;
  currentCycleDay: number;
}

export function ConceptionChart({
  cycleStartDate,
  cycleLength,
  periodLength,
  lutealPhase,
  currentCycleDay,
}: ConceptionChartProps) {
  // Generate data points for all days of the cycle
  const chartData = React.useMemo(() => {
    const data = [];
    for (let day = 1; day <= cycleLength; day++) {
      const dateStr = addDays(cycleStartDate, day - 1);
      const info = calculateDayCycleInfo(
        dateStr,
        cycleStartDate,
        cycleLength,
        periodLength,
        lutealPhase
      );
      data.push({
        dayNumber: day,
        dayLabel: `N${day}`,
        date: dateStr,
        fertilityPercentage: info.fertilityPercentage,
        phaseLabel: info.phaseLabel,
        isToday: day === currentCycleDay,
      });
    }
    return data;
  }, [cycleStartDate, cycleLength, periodLength, lutealPhase, currentCycleDay]);

  const todayPoint = chartData.find((d) => d.dayNumber === currentCycleDay) || chartData[0];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            Biểu đồ Khả năng Thụ thai trong Chu kỳ
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Xác suất mang thai (%) biến thiên theo từng ngày của chu kỳ
          </p>
        </div>
      </div>

      <div className="h-48 w-full -ml-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="fertilityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="dayNumber"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              interval="preserveStartEnd"
              tickFormatter={(v) => (v === 1 || v === Math.round(cycleLength / 2) || v === cycleLength ? `N${v}` : "")}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              unit="%"
              domain={[0, 40]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl text-xs shadow-lg border border-slate-700">
                      <p className="font-bold">
                        Ngày {d.dayNumber} ({d.date})
                      </p>
                      <p className="text-rose-400 font-semibold mt-0.5">
                        Khả năng thụ thai: {d.fertilityPercentage}%
                      </p>
                      <p className="text-slate-300 text-[10px] mt-0.5">{d.phaseLabel}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="fertilityPercentage"
              stroke="#f43f5e"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#fertilityGradient)"
            />
            {/* Today marker dot */}
            {todayPoint && (
              <ReferenceDot
                x={todayPoint.dayNumber}
                y={todayPoint.fertilityPercentage}
                r={6}
                fill="#f43f5e"
                stroke="#ffffff"
                strokeWidth={2}
              />
            )}
            {/* Ovulation marker line */}
            <ReferenceLine
              x={Math.max(1, cycleLength - lutealPhase + 1)}
              stroke="#a855f7"
              strokeDasharray="3 3"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200 dark:ring-rose-900 inline-block" />
          <span>Vị trí Hôm nay (Ngày {currentCycleDay}: {todayPoint?.fertilityPercentage}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 border-b-2 border-dashed border-purple-500 inline-block" />
          <span>Đỉnh rụng trứng</span>
        </div>
      </div>
    </div>
  );
}
