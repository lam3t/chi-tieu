"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CategorySpendingShare } from "@/lib/analytics/calc";
import { formatVND } from "@/lib/utils";

interface DonutCategoryChartProps {
  data: CategorySpendingShare[];
}

export default function DonutCategoryChart({ data }: DonutCategoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-slate-400">
        Chưa có chi tiêu trong tháng này
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.name,
    value: item.amount,
    color: item.color,
  }));

  return (
    <div className="w-full h-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any) => [formatVND(Number(value) || 0), "Số tiền"]}
            contentStyle={{
              borderRadius: "1rem",
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              color: "#fff",
              border: "none",
              fontSize: "12px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
