"use client";

import * as React from "react";
import { Transaction, Category } from "@/types/models";
import { formatVND, cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/category/category-icon";
import { Trash2 } from "lucide-react";

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export function TransactionItem({
  transaction,
  category,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const isIncome = transaction.type === "income";

  // Parse time of day
  const timeStr = React.useMemo(() => {
    try {
      const d = new Date(transaction.date);
      return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }, [transaction.date]);

  return (
    <div className="group relative flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 transition-all select-none">
      {/* Clickable Area to Edit */}
      <button
        onClick={() => onEdit(transaction)}
        className="flex items-center gap-3 min-w-0 flex-1 text-left"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
          style={{ backgroundColor: category?.color || "#64748b" }}
        >
          <CategoryIcon name={category?.icon || "Tag"} className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
              {transaction.note || category?.name || "Chi tiêu"}
            </span>
            {transaction.source === "ocr" && (
              <span className="px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[9px] font-medium text-blue-600 dark:text-blue-400 shrink-0">
                AI OCR
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            <span>{category?.name || "Chưa phân loại"}</span>
            {transaction.merchant && (
              <>
                <span>&bull;</span>
                <span className="truncate">{transaction.merchant}</span>
              </>
            )}
            <span>&bull;</span>
            <span>{timeStr}</span>
          </div>
        </div>
      </button>

      {/* Amount & Delete Action */}
      <div className="flex items-center gap-2 pl-2">
        <div className="text-right">
          <span
            className={cn(
              "text-xs font-bold font-mono tracking-tight",
              isIncome
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-900 dark:text-slate-100"
            )}
          >
            {isIncome ? "+" : "-"}
            {formatVND(transaction.amount)}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(transaction);
          }}
          className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
          title="Xóa giao dịch"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
