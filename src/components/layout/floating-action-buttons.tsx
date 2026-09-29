"use client";

import * as React from "react";
import { Plus, Camera } from "lucide-react";
import { QuickAddSheet } from "@/components/transaction/quick-add-sheet";
import { OCRConfirmSheet } from "@/components/ocr/ocr-confirm-sheet";
import { OCRItemReview } from "@/types/ocr";
import { compressReceiptImage } from "@/lib/ocr/compress";
import { useToast } from "@/components/ui/toast";
import { usePathname } from "next/navigation";
import { db } from "@/lib/db";

export function FloatingActionButtons() {
  const pathname = usePathname();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isOcrOpen, setIsOcrOpen] = React.useState(false);
  const [ocrItems, setOcrItems] = React.useState<OCRItemReview[]>([]);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Hidden on login page
  if (pathname === "/login") return null;

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const processSingleImage = async (reviewItem: OCRItemReview) => {
    try {
      // 1. Client-side compress (max 1600px, JPEG 0.7)
      const { compressedBlob } = await compressReceiptImage(reviewItem.file);

      // Get user categories to guide AI categorization
      const categories = await db.categories.toArray();

      const formData = new FormData();
      formData.append("file", compressedBlob, "receipt.jpg");
      formData.append("categories", JSON.stringify(categories));

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOcrItems((prev) =>
          prev.map((item) =>
            item.id === reviewItem.id
              ? { ...item, status: "success", result: data.data }
              : item
          )
        );
      } else {
        setOcrItems((prev) =>
          prev.map((item) =>
            item.id === reviewItem.id
              ? {
                  ...item,
                  status: "error",
                  error: data.error || "Không thể phân tích hóa đơn",
                }
              : item
          )
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setOcrItems((prev) =>
        prev.map((item) =>
          item.id === reviewItem.id
            ? { ...item, status: "error", error: message }
            : item
        )
      );
    }
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newReviews: OCRItemReview[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      const reviewItem: OCRItemReview = {
        id: Math.random().toString(36).substring(2, 9),
        imagePreviewUrl: previewUrl,
        file,
        status: "processing",
      };
      newReviews.push(reviewItem);
    }

    setOcrItems(newReviews);
    setIsOcrOpen(true);

    // Process each image concurrently
    for (const item of newReviews) {
      processSingleImage(item);
    }
  };

  const handleRemoveOcrItem = (id: string) => {
    setOcrItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      if (next.length === 0) {
        setIsOcrOpen(false);
      }
      return next;
    });
  };

  return (
    <>
      {/* Hidden file input for Camera / Gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      <div className="fixed bottom-20 right-4 z-40 flex items-center gap-2.5">
        {/* Camera OCR Button */}
        <button
          onClick={handleCameraClick}
          aria-label="Chụp hóa đơn"
          className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-lg shadow-black/10 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-90 transition-transform"
        >
          <Camera className="w-5 h-5" />
        </button>

        {/* Big Quick Add Button */}
        <button
          onClick={() => setIsAddOpen(true)}
          aria-label="Thêm chi tiêu nhanh"
          className="w-13 h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Manual Quick Add Sheet */}
      <QuickAddSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {/* OCR Confirm & Review Sheet */}
      <OCRConfirmSheet
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        items={ocrItems}
        onRemoveItem={handleRemoveOcrItem}
      />
    </>
  );
}
