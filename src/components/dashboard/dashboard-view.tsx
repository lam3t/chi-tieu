"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { formatVND } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TransactionList } from "@/components/transaction/transaction-list";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  PiggyBank,
  ChevronLeft,
} from "lucide-react";
import { CycleDashboardWidget } from "@/components/cycle/cycle-dashboard-widget";

export function DashboardView() {
  const [selectedMonth, setSelectedMonth] = React.useState<string>(() => {
    return new Date().toISOString().slice(0, 7); // YYYY-MM
  });

  // Calculate current month start and end
  const { monthStart, monthEnd, displayMonth } = React.useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-12
    const start = new Date(year, month - 1, 1).toISOString();
    const end = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
    return {
      monthStart: start,
      monthEnd: end,
      displayMonth: `Tháng ${month}, ${year}`,
    };
  }, [selectedMonth]);

  // Navigate months
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

  // Query transactions for the selected month
  const monthlyTransactions = useLiveQuery(
    () =>
      db.transactions
        .where("date")
        .between(monthStart, monthEnd, true, true)
        .filter((t) => !t.deletedAt)
        .toArray(),
    [monthStart, monthEnd]
  );

  // Compute metrics
  const { totalIncome, totalExpense, netFlow, savingsRate } =
    React.useMemo(() => {
      let income = 0;
      let expense = 0;

      monthlyTransactions?.forEach((t) => {
        if (t.type === "income") {
          income += t.amount;
        } else {
          expense += t.amount;
        }
      });

      const net = income - expense;
      const rate = income > 0 ? Math.max(0, Math.round((net / income) * 100)) : 0;

      return {
        totalIncome: income,
        totalExpense: expense,
        netFlow: net,
        savingsRate: rate,
      };
    }, [monthlyTransactions]);

  return (
    <div className="space-y-4">
      {/* Month Selector Bar */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Tháng trước"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
            {displayMonth}
          </span>
          <span className="text-[10px] text-slate-400 block">
            {monthlyTransactions?.length || 0} giao dịch
          </span>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Tháng sau"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Financial Summary Card */}
      <Card className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white border-0 shadow-lg shadow-emerald-950/20 overflow-hidden relative">
        <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none" />
        <CardContent className="p-5 relative z-10">
          <div className="flex items-center justify-between text-xs opacity-90 mb-1">
            <span>Số dư ròng khả dụng</span>
            <div className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-xs">
              <PiggyBank className="w-3 h-3 text-emerald-200" />
              <span>Tiết kiệm: {savingsRate}%</span>
            </div>
          </div>

          <div className="text-3xl font-extrabold tracking-tight font-mono">
            {netFlow < 0 ? "-" : ""}
            {formatVND(Math.abs(netFlow))}
          </div>

          {/* Income vs Expense Pills */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/15">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-4 h-4 text-emerald-200" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] opacity-80">Tổng thu</p>
                <p className="text-xs font-bold truncate font-mono">
                  +{formatVND(totalIncome)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4 text-rose-200" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] opacity-80">Tổng chi</p>
                <p className="text-xs font-bold truncate font-mono">
                  -{formatVND(totalExpense)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menstrual Cycle & Fertility Widget */}
      <CycleDashboardWidget />

      {/* Recent Transactions Section */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Giao dịch gần đây
          </h3>
          <Link
            href="/transactions"
            className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <TransactionList limit={8} showFilters={false} />
      </div>
    </div>
  );
}
