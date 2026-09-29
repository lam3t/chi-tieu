"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Category, CategoryGroup } from "@/types/models";
import { formatVND, cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/category/category-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Plus, Edit2, ShieldAlert, Sparkles, Check, X } from "lucide-react";
import { nanoid } from "nanoid";

const GROUP_LABELS: Record<CategoryGroup, { label: string; badge: string; desc: string }> = {
  needs: {
    label: "Chi phí Thiết yếu (Needs - 50%)",
    badge: "50%",
    desc: "Ăn uống, thuê nhà, xăng xe, hóa đơn điện nước bắt buộc",
  },
  wants: {
    label: "Chi tiêu Linh hoạt (Wants - 30%)",
    badge: "30%",
    desc: "Mua sắm, cafe, giải trí, du lịch, xem phim",
  },
  savings: {
    label: "Tích lũy & Đầu tư (Savings - 20%)",
    badge: "20%",
    desc: "Quỹ khẩn cấp, tiết kiệm ngân hàng, chứng khoán",
  },
  income: {
    label: "Nguồn Thu nhập (Income)",
    badge: "+",
    desc: "Tiền lương, kinh doanh, thu nhập thụ động",
  },
};

export default function CategoriesPage() {
  const { toast } = useToast();
  const categories = useLiveQuery(() => db.categories.toArray(), []);

  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [editBudget, setEditBudget] = React.useState<string>("0");
  const [editName, setEditName] = React.useState<string>("");

  const handleStartEdit = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditBudget((cat.monthlyBudget || 0).toString());
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    const budgetNum = parseInt(editBudget, 10) || 0;

    try {
      await db.categories.update(editingCategory.id, {
        name: editName.trim() || editingCategory.name,
        monthlyBudget: budgetNum > 0 ? budgetNum : undefined,
      });

      // Enqueue sync job for metadata
      await db.enqueueSyncJob("meta");

      toast({
        title: "Đã cập nhật hạng mục",
        description: `${editName}: Ngân sách ${formatVND(budgetNum)}/tháng`,
        type: "success",
      });

      setEditingCategory(null);
    } catch (e) {
      console.error(e);
      toast({
        title: "Lỗi cập nhật",
        type: "error",
      });
    }
  };

  // Group categories
  const grouped = React.useMemo(() => {
    const map: Record<CategoryGroup, Category[]> = {
      needs: [],
      wants: [],
      savings: [],
      income: [],
    };
    categories?.forEach((c) => {
      if (map[c.group]) {
        map[c.group].push(c);
      }
    });
    return map;
  }, [categories]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Hạng mục & Định mức Ngân sách
          </h2>
          <p className="text-xs text-slate-500">
            Phân loại theo chuẩn PFM (Quy tắc 50/30/20)
          </p>
        </div>
      </div>

      {/* Category Groups */}
      {(["needs", "wants", "savings", "income"] as CategoryGroup[]).map((groupKey) => {
        const groupInfo = GROUP_LABELS[groupKey];
        const items = grouped[groupKey];
        const totalBudget = items.reduce((sum, item) => sum + (item.monthlyBudget || 0), 0);

        return (
          <Card key={groupKey} className="overflow-hidden">
            <CardHeader className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {groupInfo.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{groupInfo.desc}</p>
                </div>
                {groupKey !== "income" && totalBudget > 0 && (
                  <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatVND(totalBudget)}
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-2 space-y-1">
              {items.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {cat.name}
                      </p>
                      {cat.monthlyBudget ? (
                        <p className="text-[10px] text-slate-400 font-mono">
                          Ngân sách: {formatVND(cat.monthlyBudget)}/tháng
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">Chưa đặt ngân sách</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartEdit(cat)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    title="Chỉnh sửa ngân sách"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white"
                  style={{ backgroundColor: editingCategory.color }}
                >
                  <CategoryIcon name={editingCategory.icon} className="w-3 h-3" />
                </div>
                Chỉnh sửa Hạng mục
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                  Tên hạng mục
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-hidden"
                />
              </div>

              {editingCategory.type === "expense" && (
                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                    Ngân sách hàng tháng (VND)
                  </label>
                  <input
                    type="number"
                    step="100000"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Hiển thị: {formatVND(parseInt(editBudget, 10) || 0)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setEditingCategory(null)}
              >
                Hủy
              </Button>
              <Button className="flex-1 text-xs" onClick={handleSaveCategory}>
                <Check className="w-3.5 h-3.5 mr-1" />
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
