"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Category, Transaction } from "@/types/models";
import { formatVND, cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/category/category-icon";
import { useToast } from "@/components/ui/toast";
import {
  X,
  Calendar,
  FileText,
  Delete,
  Check,
  Trash2,
} from "lucide-react";

interface QuickAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
}

export function QuickAddSheet({
  isOpen,
  onClose,
  editTransaction,
}: QuickAddSheetProps) {
  const { toast } = useToast();

  const [type, setType] = React.useState<"expense" | "income">("expense");
  const [amountStr, setAmountStr] = React.useState<string>("0");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("");
  const [note, setNote] = React.useState<string>("");
  const [date, setDate] = React.useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [showNoteInput, setShowNoteInput] = React.useState(false);

  // Fetch categories from Dexie
  const categories = useLiveQuery(() => db.categories.toArray(), []);

  // Fetch most-used category IDs
  const [mostUsedCatIds, setMostUsedCatIds] = React.useState<string[]>([]);
  React.useEffect(() => {
    if (isOpen) {
      db.getRecentCategoryUsage(12).then((ids) => setMostUsedCatIds(ids));
    }
  }, [isOpen]);

  // Sort categories: filtered by type, then most-used first
  const sortedCategories = React.useMemo(() => {
    if (!categories) return [];
    const filtered = categories.filter((c) => c.type === type);
    return filtered.sort((a, b) => {
      const idxA = mostUsedCatIds.indexOf(a.id);
      const idxB = mostUsedCatIds.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [categories, type, mostUsedCatIds]);

  // Sync state when editing or opening
  React.useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmountStr(editTransaction.amount.toString());
      setSelectedCategoryId(editTransaction.categoryId);
      setNote(editTransaction.note || "");
      setDate(editTransaction.date.slice(0, 10));
      setShowNoteInput(!!editTransaction.note);
    } else {
      setType("expense");
      setAmountStr("0");
      setNote("");
      setDate(new Date().toISOString().slice(0, 10));
      setShowNoteInput(false);
      // Auto select first sorted category
      if (sortedCategories.length > 0) {
        setSelectedCategoryId(sortedCategories[0].id);
      }
    }
  }, [editTransaction, isOpen]);

  // Update default selected category if type changes and current selection is invalid
  React.useEffect(() => {
    if (sortedCategories.length > 0) {
      const exists = sortedCategories.some((c) => c.id === selectedCategoryId);
      if (!exists) {
        setSelectedCategoryId(sortedCategories[0].id);
      }
    }
  }, [type, sortedCategories, selectedCategoryId]);

  if (!isOpen) return null;

  const currentAmount = parseInt(amountStr, 10) || 0;

  // Keypad actions
  const handleKeypadPress = (val: string) => {
    if (val === "BACKSPACE") {
      setAmountStr((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
      return;
    }
    if (val === "000") {
      if (amountStr === "0") return;
      if (amountStr.length >= 10) return;
      setAmountStr((prev) => prev + "000");
      return;
    }
    // Number digit
    if (amountStr === "0") {
      setAmountStr(val);
    } else {
      if (amountStr.length >= 10) return; // Prevent overflow
      setAmountStr((prev) => prev + val);
    }
  };

  const handleSave = async () => {
    if (currentAmount <= 0) {
      toast({
        title: "Vui lòng nhập số tiền",
        type: "error",
      });
      return;
    }

    if (!selectedCategoryId) {
      toast({
        title: "Vui lòng chọn một hạng mục",
        type: "error",
      });
      return;
    }

    try {
      const dateIso = new Date(date).toISOString();

      if (editTransaction) {
        await db.updateTransaction(editTransaction.id, {
          type,
          amount: currentAmount,
          categoryId: selectedCategoryId,
          note: note.trim(),
          date: dateIso,
        });

        toast({
          title: "Đã cập nhật giao dịch",
          description: `${formatVND(currentAmount)} - ${note || "Không có ghi chú"}`,
          type: "success",
        });
      } else {
        const added = await db.addTransaction({
          type,
          amount: currentAmount,
          categoryId: selectedCategoryId,
          note: note.trim(),
          date: dateIso,
          source: "manual",
        });

        toast({
          title: `Đã lưu ${formatVND(currentAmount)}`,
          description: "Giao dịch đã được ghi vào sổ",
          type: "success",
          action: {
            label: "Hoàn tác",
            onClick: async () => {
              await db.softDeleteTransaction(added.id);
            },
          },
        });
      }

      onClose();
    } catch (err) {
      console.error("Save transaction error:", err);
      toast({
        title: "Lỗi lưu giao dịch",
        description: "Vui lòng thử lại",
        type: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!editTransaction) return;
    try {
      await db.softDeleteTransaction(editTransaction.id);
      toast({
        title: "Đã xóa giao dịch",
        type: "success",
        action: {
          label: "Khôi phục",
          onClick: async () => {
            await db.restoreTransaction(editTransaction.id);
          },
        },
      });
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Bottom Sheet Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 p-4 pb-safe flex flex-col max-h-[92vh] z-10 animate-in slide-in-from-bottom duration-250">
        {/* Drag handle & Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setType("expense")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-lg transition-all",
                type === "expense"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              )}
            >
              Chi tiêu
            </button>
            <button
              onClick={() => setType("income")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-lg transition-all",
                type === "income"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              )}
            >
              Thu nhập
            </button>
          </div>

          <div className="flex items-center gap-2">
            {editTransaction && (
              <button
                onClick={handleDelete}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                title="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Amount Display */}
        <div className="text-center py-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl my-2.5 border border-slate-100 dark:border-slate-800/80">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block">
            {type === "expense" ? "Số tiền chi" : "Số tiền thu"}
          </span>
          <div
            className={cn(
              "text-3xl font-extrabold tracking-tight font-mono mt-0.5",
              type === "expense"
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {formatVND(currentAmount)}
          </div>
        </div>

        {/* Horizontally scrollable Category Chips */}
        <div className="mb-2">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">
            Hạng mục:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {sortedCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition-all shrink-0 active:scale-95",
                    isSelected
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  )}
                >
                  <div
                    className="w-5 h-5 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} className="w-3 h-3" />
                  </div>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date & Note toggles */}
        <div className="flex items-center gap-2 my-1 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-xs font-medium outline-hidden w-full"
            />
          </div>

          <button
            onClick={() => setShowNoteInput(!showNoteInput)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors",
              showNoteInput || note
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"
                : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{note ? "Ghi chú: " + note.slice(0, 10) + "..." : "Ghi chú"}</span>
          </button>
        </div>

        {/* Note Input (expandable) */}
        {showNoteInput && (
          <div className="my-1">
            <input
              type="text"
              placeholder="Ghi chú chi tiết (ví dụ: Ăn trưa phở Bát Đàn...)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 outline-hidden focus:border-emerald-500"
              autoFocus
            />
          </div>
        )}

        {/* Numeric Keypad: 4x3 Grid */}
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0"].map(
            (key) => (
              <button
                key={key}
                onClick={() => handleKeypadPress(key)}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-600 text-base font-semibold text-slate-800 dark:text-slate-100 transition-all select-none active:scale-95 shadow-2xs"
              >
                {key}
              </button>
            )
          )}
          <button
            onClick={() => handleKeypadPress("BACKSPACE")}
            className="h-11 rounded-xl bg-slate-200/80 hover:bg-slate-300 active:bg-slate-400 dark:bg-slate-700/80 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all select-none active:scale-95 shadow-2xs"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Save Button */}
        <div className="mt-3">
          <button
            onClick={handleSave}
            className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{editTransaction ? "Cập nhật giao dịch" : "Lưu giao dịch"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
