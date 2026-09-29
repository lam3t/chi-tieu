"use client";

import * as React from "react";
import Image from "next/image";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { OCRItemReview, OCRResult } from "@/types/ocr";
import { Category, Transaction } from "@/types/models";
import { formatVND, cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/category/category-icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  X,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Store,
  ChevronRight,
  ChevronLeft,
  Trash2,
} from "lucide-react";

interface OCRConfirmSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: OCRItemReview[];
  onRemoveItem: (id: string) => void;
}

export function OCRConfirmSheet({
  isOpen,
  onClose,
  items,
  onRemoveItem,
}: OCRConfirmSheetProps) {
  const { toast } = useToast();
  const categories = useLiveQuery(() => db.categories.toArray(), []);

  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Editable fields for the current item
  const currentItem = items[currentIndex];

  const [amountStr, setAmountStr] = React.useState("0");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("");
  const [merchant, setMerchant] = React.useState("");
  const [note, setNote] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = React.useState<"expense" | "income">("expense");

  // Populate fields when current item changes or OCR finishes
  React.useEffect(() => {
    if (currentItem?.result) {
      const res = currentItem.result;
      setAmountStr(res.amount.toString());
      setMerchant(res.merchant || "");
      setNote(res.rawText ? `${res.merchant || "Hóa đơn"}` : "");
      if (res.date) {
        setDate(res.date.slice(0, 10));
      }
      setType(res.type);

      // Guess category or default
      if (res.categoryGuess) {
        setSelectedCategoryId(res.categoryGuess);
      } else if (categories && categories.length > 0) {
        setSelectedCategoryId(categories[0].id);
      }
    } else {
      setAmountStr("0");
      setMerchant("");
      setNote("");
    }
  }, [currentItem, categories]);

  if (!isOpen || items.length === 0) return null;

  const currentAmount = parseInt(amountStr, 10) || 0;

  const handleSaveCurrent = async () => {
    if (currentAmount <= 0) {
      toast({
        title: "Vui lòng kiểm tra số tiền",
        type: "error",
      });
      return;
    }

    try {
      const dateIso = new Date(date).toISOString();

      const added = await db.addTransaction({
        type,
        amount: currentAmount,
        categoryId: selectedCategoryId || "cat_an_uong",
        note: note.trim() || merchant || "Hóa đơn quét AI",
        merchant: merchant.trim() || undefined,
        date: dateIso,
        source: "ocr",
      });

      toast({
        title: `Đã lưu ${formatVND(currentAmount)} (AI)`,
        description: `${merchant || "Hóa đơn"} - Đã ghi vào sổ`,
        type: "success",
        action: {
          label: "Hoàn tác",
          onClick: async () => {
            await db.softDeleteTransaction(added.id);
          },
        },
      });

      // Remove current item from batch
      onRemoveItem(currentItem.id);

      // If more items exist, advance or stay
      if (items.length <= 1) {
        onClose();
      } else {
        setCurrentIndex((prev) => Math.min(prev, items.length - 2));
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Lỗi lưu giao dịch",
        type: "error",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 p-4 pb-safe flex flex-col max-h-[92vh] z-10 animate-in slide-in-from-bottom duration-250">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Xác nhận Hóa đơn AI
                {items.length > 1 && (
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-mono">
                    {currentIndex + 1} / {items.length}
                  </span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRemoveItem(currentItem.id)}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl"
              title="Bỏ qua ảnh này"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto no-scrollbar py-3 space-y-3.5">
          {/* Status / Preview */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-700">
              <Image
                src={currentItem.imagePreviewUrl}
                alt="Receipt"
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              {currentItem.status === "processing" ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>AI đang bóc tách hóa đơn...</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Đang phân tích số tiền, cửa hàng và gợi ý danh mục...
                  </p>
                </div>
              ) : currentItem.status === "error" ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Không thể tự động nhận diện</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {currentItem.error || "Bạn có thể điền thông tin bằng tay bên dưới."}
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã nhận diện thành công</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                    {formatVND(currentAmount)}
                  </p>
                  {merchant && (
                    <p className="text-[11px] text-slate-500 truncate">
                      Nơi bán: {merchant}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form Fields for User to Verify and Edit */}
          <div className="space-y-3">
            {/* Amount & Type Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-500">
                  Số tiền (VND)
                </label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setType("expense")}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-semibold transition-colors",
                      type === "expense"
                        ? "bg-rose-500 text-white"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Chi tiêu
                  </button>
                  <button
                    onClick={() => setType("income")}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-semibold transition-colors",
                      type === "income"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Thu nhập
                  </button>
                </div>
              </div>
              <input
                type="number"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-bold font-mono outline-hidden focus:border-emerald-500"
              />
              <span className="text-[11px] text-emerald-600 font-mono mt-0.5 block">
                {formatVND(currentAmount)}
              </span>
            </div>

            {/* Merchant / Store */}
            <div>
              <label className="text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
                <Store className="w-3.5 h-3.5" />
                Cửa hàng / Người nhận
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Shopee, Grab, Highlands Coffee..."
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Ngày giao dịch
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Category Select Chips */}
            <div>
              <label className="text-[11px] font-medium text-slate-500 mb-1.5 block">
                Gợi ý Hạng mục:
              </label>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {categories
                  ?.filter((c) => c.type === type)
                  .map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
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
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            onClick={handleSaveCurrent}
            disabled={currentItem.status === "processing"}
            className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Xác nhận & Lưu giao dịch</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
