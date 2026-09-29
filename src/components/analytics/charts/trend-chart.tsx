"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MonthlyTrendPoint } from "@/lib/analytics/calc";
import { formatVND } from "@/lib/utils";

interface TrendChartProps {
  data: MonthlyTrendPoint[];
}

export default function TrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-slate-400">
        Chưa đủ dữ liệu lịch sử
      </div>
    );
  }

  return (
    <div className="w-full h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="displayMonth"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => {
              if (val >= 1000000) return `${Math.round(val / 1000000)}Tr`;
              if (val >= 1000) return `${Math.round(val / 1000)}k`;
              return val.toString();
            }}
          />
          <Tooltip
            formatter={(value: any, name: any) => [
              formatVND(Number(value) || 0),
              name === "income" ? "Thu nhập" : "Chi tiêu",
            ]}
            contentStyle={{
              borderRadius: "1rem",
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              color: "#fff",
              border: "none",
              fontSize: "12px",
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
            formatter={(val) => (val === "income" ? "Thu nhập" : "Chi tiêu")}
          />
          <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={16} />
          <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
