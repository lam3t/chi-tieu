"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatVND } from "@/lib/utils";

interface DailyBarChartProps {
  data: { day: number; amount: number }[];
  averagePerDay: number;
}

export default function DailyBarChart({
  data,
  averagePerDay,
}: DailyBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-slate-400">
        Chưa có chi tiêu hàng ngày
      </div>
    );
  }

  return (
    <div className="w-full h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
        >
          <XAxis
            dataKey="day"
            stroke="#94a3b8"
            fontSize={9}
            tickLine={false}
            axisLine={false}
            interval={3}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={9}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => {
              if (val >= 1000000) return `${Math.round(val / 1000000)}Tr`;
              if (val >= 1000) return `${Math.round(val / 1000)}k`;
              return "0";
            }}
          />
          <Tooltip
            formatter={(value: any) => [formatVND(Number(value) || 0), "Chi tiêu"]}
            labelFormatter={(label) => `Ngày ${label}`}
            contentStyle={{
              borderRadius: "1rem",
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              color: "#fff",
              border: "none",
              fontSize: "11px",
            }}
          />
          {averagePerDay > 0 && (
            <ReferenceLine
              y={averagePerDay}
              stroke="#eab308"
              strokeDasharray="3 3"
              label={{
                value: "TB/ngày",
                fill: "#eab308",
                fontSize: 9,
                position: "insideTopRight",
              }}
            />
          )}
          <Bar dataKey="amount" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={10} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
