"use client";

import * as React from "react";
import { X, Smile, Frown, Meh, HeartPulse, Check, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateString } from "@/lib/cycle/calculator";
import { useToast } from "@/components/ui/toast";

interface SymptomsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: string;
}

export function SymptomsSheet({
  isOpen,
  onClose,
  selectedDate,
}: SymptomsSheetProps) {
  const { toast } = useToast();
  const dateStr = selectedDate || formatDateString(new Date());

  const [flow, setFlow] = React.useState<string>("medium");
  const [cramps, setCramps] = React.useState<string>("mild");
  const [mood, setMood] = React.useState<string>("calm");
  const [note, setNote] = React.useState<string>("");

  if (!isOpen) return null;

  const handleSave = () => {
    toast({
      title: "Đã lưu triệu chứng hôm nay!",
      description: `Ghi nhận cho ngày ${dateStr}`,
      type: "success",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Nhật ký Triệu chứng & Cảm xúc
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Ghi nhận ngày {dateStr}
        </p>

        <div className="space-y-4">
          {/* Lượng kinh nguyệt (Flow) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Lượng máu kinh (Flow)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "spotting", label: "Đốm nhỏ" },
                { id: "light", label: "Nhẹ" },
                { id: "medium", label: "Vừa" },
                { id: "heavy", label: "Nhiều" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFlow(item.id)}
                  className={`py-2 px-1 text-xs rounded-xl border font-medium transition-all ${
                    flow === item.id
                      ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 font-bold"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cơn đau bụng kinh (Cramps) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Mức độ đau bụng
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "none", label: "Không đau" },
                { id: "mild", label: "Nhẹ" },
                { id: "moderate", label: "Vừa phải" },
                { id: "severe", label: "Dữ dội" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCramps(item.id)}
                  className={`py-2 px-1 text-xs rounded-xl border font-medium transition-all ${
                    cramps === item.id
                      ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 font-bold"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tâm trạng (Mood) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Tâm trạng
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "happy", label: "Vui vẻ 😊" },
                { id: "calm", label: "Bình yên 😌" },
                { id: "sensitive", label: "Nhạy cảm 🥺" },
                { id: "irritable", label: "Khó chịu 😣" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMood(item.id)}
                  className={`py-2 px-1 text-xs rounded-xl border font-medium transition-all ${
                    mood === item.id
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-600 font-bold"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ghi chú thêm */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ghi chú thêm
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhiệt độ, thể trạng hoặc dấu hiệu đặc biệt..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>

          <Button
            onClick={handleSave}
            className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
          >
            <Check className="w-4 h-4 mr-1.5" />
            Lưu nhật ký ngày này
          </Button>
        </div>
      </div>
    </div>
  );
}
