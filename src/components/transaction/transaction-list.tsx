"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Transaction, Category } from "@/types/models";
import { TransactionItem } from "./transaction-item";
import { QuickAddSheet } from "./quick-add-sheet";
import { useToast } from "@/components/ui/toast";
import { formatVND, cn } from "@/lib/utils";
import { Search, Filter, Plus, Calendar, ArrowUpDown } from "lucide-react";

interface GroupedDay {
  dateKey: string; // YYYY-MM-DD
  displayTitle: string;
  totalExpense: number;
  totalIncome: number;
  items: Transaction[];
}

export function TransactionList({
  limit,
  showFilters = true,
}: {
  limit?: number;
  showFilters?: boolean;
}) {
  const { toast } = useToast();
  const [search, setSearch] = React.useState("");
  const [filterType, setFilterType] = React.useState<"all" | "expense" | "income">("all");
  const [filterCategory, setFilterCategory] = React.useState<string>("all");
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  // Live queries from Dexie
  const transactions = useLiveQuery(
    () =>
      db.transactions
        .filter((t) => !t.deletedAt)
        .reverse()
        .sortBy("date"),
    []
  );

  const categories = useLiveQuery(() => db.categories.toArray(), []);
  const categoryMap = React.useMemo(() => {
    const map = new Map<string, Category>();
    categories?.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Handle Edit
  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsEditOpen(true);
  };

  // Handle Delete with Undo Toast
  const handleDelete = async (tx: Transaction) => {
    try {
      await db.softDeleteTransaction(tx.id);
      toast({
        title: "Đã xóa giao dịch",
        description: `${formatVND(tx.amount)} - ${tx.note || "Không có ghi chú"}`,
        type: "info",
        action: {
          label: "Hoàn tác",
          onClick: async () => {
            await db.restoreTransaction(tx.id);
          },
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Filter transactions
  const filteredList = React.useMemo(() => {
    if (!transactions) return [];

    let list = transactions;

    if (filterType !== "all") {
      list = list.filter((t) => t.type === filterType);
    }

    if (filterCategory !== "all") {
      list = list.filter((t) => t.categoryId === filterCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        const cat = categoryMap.get(t.categoryId);
        return (
          t.note.toLowerCase().includes(q) ||
          (t.merchant && t.merchant.toLowerCase().includes(q)) ||
          (cat && cat.name.toLowerCase().includes(q)) ||
          t.amount.toString().includes(q)
        );
      });
    }

    if (limit && limit > 0) {
      list = list.slice(0, limit);
    }

    return list;
  }, [transactions, filterType, filterCategory, search, limit, categoryMap]);

  // Group by day
  const groupedDays = React.useMemo(() => {
    const groups: Record<string, GroupedDay> = {};
    const todayStr = new Date().toISOString().slice(0, 10);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    filteredList.forEach((t) => {
      const dateKey = t.date.slice(0, 10);
      if (!groups[dateKey]) {
        let displayTitle = dateKey;
        if (dateKey === todayStr) {
          displayTitle = "Hôm nay";
        } else if (dateKey === yesterdayStr) {
          displayTitle = "Hôm qua";
        } else {
          try {
            const parts = dateKey.split("-");
            displayTitle = `${parts[2]} Tháng ${parts[1]}, ${parts[0]}`;
          } catch {
            displayTitle = dateKey;
          }
        }

        groups[dateKey] = {
          dateKey,
          displayTitle,
          totalExpense: 0,
          totalIncome: 0,
          items: [],
        };
      }

      groups[dateKey].items.push(t);
      if (t.type === "expense") {
        groups[dateKey].totalExpense += t.amount;
      } else {
        groups[dateKey].totalIncome += t.amount;
      }
    });

    return Object.values(groups).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [filteredList]);

  return (
    <div className="space-y-3">
      {/* Search & Filters */}
      {showFilters && (
        <div className="space-y-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo ghi chú, nơi bán, số tiền..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-hidden focus:border-emerald-500 placeholder:text-slate-400"
            />
          </div>

          {/* Type & Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setFilterType("all")}
              className={cn(
                "px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap border transition-all",
                filterType === "all"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent font-semibold"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
              )}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType("expense")}
              className={cn(
                "px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap border transition-all",
                filterType === "expense"
                  ? "bg-rose-500 text-white border-transparent font-semibold shadow-xs"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
              )}
            >
              Khoản chi
            </button>
            <button
              onClick={() => setFilterType("income")}
              className={cn(
                "px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap border transition-all",
                filterType === "income"
                  ? "bg-emerald-600 text-white border-transparent font-semibold shadow-xs"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
              )}
            >
              Khoản thu
            </button>

            {/* Category Dropdown Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-7 text-xs px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 outline-hidden font-medium"
            >
              <option value="all">Tất cả hạng mục</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Empty State */}
      {groupedDays.length === 0 && (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Plus className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Chưa có giao dịch nào
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Chạm vào nút (+) bên dưới để thêm khoản chi tiêu đầu tiên chỉ trong 3 chạm và 5 giây!
            </p>
          </div>
        </div>
      )}

      {/* Grouped Day List */}
      <div className="space-y-4">
        {groupedDays.map((group) => (
          <div key={group.dateKey} className="space-y-1.5">
            {/* Day Header */}
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {group.displayTitle}
              </span>
              <div className="text-[11px] text-slate-400 font-mono">
                {group.totalExpense > 0 && (
                  <span className="text-slate-600 dark:text-slate-400">
                    Chi: -{formatVND(group.totalExpense)}
                  </span>
                )}
                {group.totalIncome > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 ml-2">
                    Thu: +{formatVND(group.totalIncome)}
                  </span>
                )}
              </div>
            </div>

            {/* Day Items */}
            <div className="space-y-1.5">
              {group.items.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  category={categoryMap.get(tx.categoryId)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <QuickAddSheet
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingTransaction(null);
        }}
        editTransaction={editingTransaction}
      />
    </div>
  );
}
