"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  calculate503020,
  calculateCategoryBudgets,
  calculateCategoryBreakdown,
  calculateTopMerchants,
  calculateTrend,
  calculateDailySpending,
  calculateInsights,
} from "@/lib/analytics/calc";
import { formatVND, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryIcon } from "@/components/category/category-icon";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  PieChart as PieIcon,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Store,
  CalendarDays,
  Target,
  Plus,
} from "lucide-react";
import Link from "next/link";

// Skeleton for dynamically imported charts
function ChartSkeleton() {
  return (
    <div className="w-full h-48 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse flex items-center justify-center text-xs text-slate-400">
      Đang dựng biểu đồ...
    </div>
  );
}

// Bundle-split dynamic imports for charts
const DynamicDonutChart = dynamic(
  () => import("./charts/donut-category-chart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const DynamicTrendChart = dynamic(
  () => import("./charts/trend-chart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const DynamicDailyChart = dynamic(
  () => import("./charts/daily-bar-chart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export function AnalyticsView() {
  const [selectedMonth, setSelectedMonth] = React.useState<string>(() => {
    return new Date().toISOString().slice(0, 7); // YYYY-MM
  });

  // Calculate month boundaries
  const { monthStart, monthEnd, displayMonth } = React.useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const start = new Date(year, month - 1, 1).toISOString();
    const end = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
    return {
      monthStart: start,
      monthEnd: end,
      displayMonth: `Tháng ${month}, ${year}`,
    };
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const prev = new Date(y, m - 2, 1);
    setSelectedMonth(prev.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const next = new Date(y, m, 1);
    setSelectedMonth(next.toISOString().slice(0, 7));
  };

  // Queries from Dexie
  const monthlyTransactions = useLiveQuery(
    () =>
      db.transactions
        .where("date")
        .between(monthStart, monthEnd, true, true)
        .filter((t) => !t.deletedAt)
        .toArray(),
    [monthStart, monthEnd]
  );

  const allTransactions = useLiveQuery(
    () => db.transactions.filter((t) => !t.deletedAt).toArray(),
    []
  );

  const categories = useLiveQuery(() => db.categories.toArray(), []);

  // Compute analytics
  const rule503020 = React.useMemo(() => {
    if (!monthlyTransactions || !categories) return null;
    return calculate503020(monthlyTransactions, categories);
  }, [monthlyTransactions, categories]);

  const categoryBudgets = React.useMemo(() => {
    if (!monthlyTransactions || !categories) return [];
    return calculateCategoryBudgets(monthlyTransactions, categories);
  }, [monthlyTransactions, categories]);

  const { items: categoryItems, top5: top5Categories } = React.useMemo(() => {
    if (!monthlyTransactions || !categories) return { items: [], top5: [] };
    return calculateCategoryBreakdown(monthlyTransactions, categories);
  }, [monthlyTransactions, categories]);

  const topMerchants = React.useMemo(() => {
    if (!monthlyTransactions) return [];
    return calculateTopMerchants(monthlyTransactions, 5);
  }, [monthlyTransactions]);

  const trendData = React.useMemo(() => {
    if (!allTransactions) return [];
    return calculateTrend(allTransactions, selectedMonth, 6);
  }, [allTransactions, selectedMonth]);

  const dailySpending = React.useMemo(() => {
    if (!monthlyTransactions) return null;
    return calculateDailySpending(monthlyTransactions, selectedMonth);
  }, [monthlyTransactions, selectedMonth]);

  const insights = React.useMemo(() => {
    if (!monthlyTransactions || !categories || !allTransactions) return [];
    return calculateInsights(
      monthlyTransactions,
      allTransactions.filter((t) => !t.date.startsWith(selectedMonth)),
      categories
    );
  }, [monthlyTransactions, allTransactions, categories, selectedMonth]);

  const hasData = (monthlyTransactions?.length || 0) > 0;

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {displayMonth}
          </span>
          <span className="text-[10px] text-slate-400 block">
            Báo cáo tài chính PFM
          </span>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <Card className="p-3.5 bg-white dark:bg-slate-900">
          <p className="text-[11px] text-slate-400 font-medium">Tổng thu nhập</p>
          <p className="text-base font-bold font-mono text-emerald-600 mt-0.5 truncate">
            +{formatVND(rule503020?.totalIncome || 0)}
          </p>
        </Card>

        <Card className="p-3.5 bg-white dark:bg-slate-900">
          <p className="text-[11px] text-slate-400 font-medium">Tổng chi tiêu</p>
          <p className="text-base font-bold font-mono text-rose-600 mt-0.5 truncate">
            -{formatVND(rule503020?.totalExpense || 0)}
          </p>
        </Card>
      </div>

      {/* Empty State */}
      {!hasData && (
        <Card className="p-8 text-center border-dashed">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <PieIcon className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Chưa có số liệu trong {displayMonth}
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Hãy bắt đầu thêm khoản chi tiêu hoặc thu nhập đầu tiên bằng nút (+) để mở khóa biểu đồ phân tích.
          </p>
        </Card>
      )}

      {hasData && (
        <>
          {/* Section 1: Rule 50/30/20 */}
          {rule503020 && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                  <Target className="w-4 h-4 text-emerald-600" />
                  Quy Tắc Quản Lý Tài Chính 50/30/20
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3">
                {/* Needs */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Thiết yếu (Needs)
                    </span>
                    <span className="font-mono text-slate-500">
                      {formatVND(rule503020.needs.amount)} ({rule503020.needs.percentage}% / mục tiêu 50%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        rule503020.needs.percentage > 50 ? "bg-amber-500" : "bg-blue-500"
                      )}
                      style={{ width: `${Math.min(rule503020.needs.percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Wants */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Linh hoạt (Wants)
                    </span>
                    <span className="font-mono text-slate-500">
                      {formatVND(rule503020.wants.amount)} ({rule503020.wants.percentage}% / mục tiêu 30%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        rule503020.wants.percentage > 30 ? "bg-rose-500" : "bg-purple-500"
                      )}
                      style={{ width: `${Math.min(rule503020.wants.percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Savings */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Tích lũy & Đầu tư (Savings)
                    </span>
                    <span className="font-mono text-slate-500">
                      {formatVND(rule503020.savings.amount)} ({rule503020.savings.percentage}% / mục tiêu 20%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(rule503020.savings.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 2: Budget vs Actual Per Category */}
          {categoryBudgets.length > 0 && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Định Mức Ngân Sách Hạng Mục
                  </CardTitle>
                  <Link
                    href="/categories"
                    className="text-[10px] text-emerald-600 hover:underline"
                  >
                    Sửa ngân sách
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3">
                {categoryBudgets.map((b) => (
                  <div key={b.category.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center text-white"
                          style={{ backgroundColor: b.category.color }}
                        >
                          <CategoryIcon name={b.category.icon} className="w-3 h-3" />
                        </div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {b.category.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-slate-500">
                          {formatVND(b.spent)} / {formatVND(b.budget)}
                        </span>
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded-md text-[9px] font-bold font-mono",
                            b.status === "alert"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              : b.status === "warning"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          )}
                        >
                          {b.percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          b.status === "alert"
                            ? "bg-rose-500"
                            : b.status === "warning"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Section 3: Spending Donut & Top 5 Spenders */}
          <Card>
            <CardHeader className="p-4 pb-1">
              <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-emerald-600" />
                Cơ Cấu Chi Tiêu Theo Hạng Mục
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <DynamicDonutChart data={categoryItems} />

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Top 5 chi tiêu nhiều nhất:
                </p>
                {top5Categories.map((c) => (
                  <div key={c.categoryId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {c.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                        {formatVND(c.amount)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono w-8 text-right">
                        {c.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Merchants */}
          {topMerchants.length > 0 && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-blue-500" />
                  Top Nơi Chi Tiêu Nhiều Nhất
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {topMerchants.map((m) => (
                  <div key={m.merchant} className="flex items-center justify-between text-xs py-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                      {m.merchant}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {m.count} lần
                      </span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {formatVND(m.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Section 4: 6-Month Income vs Expense Trend */}
          <Card>
            <CardHeader className="p-4 pb-1">
              <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Xu Hướng Thu & Chi 6 Tháng
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <DynamicTrendChart data={trendData} />
            </CardContent>
          </Card>

          {/* Section 5: Daily Spending & Pace Projection */}
          {dailySpending && (
            <Card>
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-indigo-500" />
                  Chi Tiêu Từng Ngày & Dự Phóng Cuối Tháng
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <DynamicDailyChart
                  data={dailySpending.dailyPoints}
                  averagePerDay={dailySpending.averagePerDay}
                />

                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Trung bình / ngày</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {formatVND(dailySpending.averagePerDay)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Dự phóng cả tháng</span>
                    <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {formatVND(dailySpending.projectedMonthEnd)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 6: Rule-Based Financial Insights */}
          {insights.length > 0 && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <Lightbulb className="w-4 h-4" />
                  Nhận Định & Khuyến Nghị Tài Chính
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2.5">
                {insights.map((ins) => (
                  <div
                    key={ins.id}
                    className={cn(
                      "p-3 rounded-2xl text-xs space-y-0.5 border",
                      ins.type === "warning"
                        ? "bg-amber-50/70 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50 text-amber-950 dark:text-amber-200"
                        : ins.type === "success"
                        ? "bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-200"
                        : "bg-blue-50/70 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/50 text-blue-950 dark:text-blue-200"
                    )}
                  >
                    <p className="font-semibold">{ins.title}</p>
                    <p className="text-[11px] leading-relaxed opacity-90">{ins.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
