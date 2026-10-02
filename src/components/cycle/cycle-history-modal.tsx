"use client";

import * as React from "react";
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Check,
  Sparkles,
  Droplet,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { MenstrualCycleLog, CycleCalculationResult } from "@/types/cycle";
import { formatDateString } from "@/lib/cycle/calculator";
import { useToast } from "@/components/ui/toast";

interface CycleHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: MenstrualCycleLog[];
  calculation?: CycleCalculationResult;
  onRefresh: () => void;
}

export function CycleHistoryModal({
  isOpen,
  onClose,
  logs,
  calculation,
  onRefresh,
}: CycleHistoryModalProps) {
  const { toast } = useToast();
  const todayStr = React.useMemo(() => formatDateString(new Date()), []);

  const [isAdding, setIsAdding] = React.useState(false);
  const [newStartDate, setNewStartDate] = React.useState<string>(todayStr);
  const [newPeriodDays, setNewPeriodDays] = React.useState<number>(5);
  const [newNotes, setNewNotes] = React.useState<string>("");

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editStartDate, setEditStartDate] = React.useState<string>("");
  const [editPeriodDays, setEditPeriodDays] = React.useState<number>(5);

  if (!isOpen) return null;

  const handleAddNewPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStartDate) return;

    try {
      await db.logNewPeriod(newStartDate, {
        periodDays: newPeriodDays,
        notes: newNotes,
      });

      toast({
        title: "Đã ghi nhận kỳ kinh mới!",
        description: `Hệ thống đã tính toán lại chu kỳ từ ngày ${newStartDate}`,
        type: "success",
      });

      setIsAdding(false);
      setNewNotes("");
      onRefresh();
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Không thể thêm kỳ kinh",
        type: "error",
      });
    }
  };

  const handleStartEdit = (log: MenstrualCycleLog) => {
    setEditingId(log.id);
    setEditStartDate(log.startDate);
    setEditPeriodDays(log.periodDays || 5);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editStartDate) return;
    try {
      await db.updatePeriodLog(id, {
        startDate: editStartDate,
        periodDays: editPeriodDays,
      });

      toast({
        title: "Đã cập nhật ngày kinh nguyệt!",
        description: `Chu kỳ đã được điều chỉnh và tính toán theo ngày mới (${editStartDate})`,
        type: "success",
      });

      setEditingId(null);
      onRefresh();
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật ngày kinh",
        type: "error",
      });
    }
  };

  const handleDeleteLog = async (id: string, dateStr: string) => {
    if (!confirm(`Bạn có chắc muốn xóa kỳ kinh ngày ${dateStr}?`)) return;

    try {
      await db.deletePeriodLog(id);
      toast({
        title: "Đã xóa kỳ kinh",
        description: "Hệ thống đã cập nhật lại chu kỳ mới nhất",
        type: "success",
      });
      onRefresh();
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Không thể xóa kỳ kinh",
        type: "error",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl p-6 relative flex flex-col">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Lịch sử & Điều chỉnh Ngày kinh
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cập nhật ngày kinh mới bất kỳ lúc nào để hệ thống tính lại chu kỳ
            </p>
          </div>
        </div>

        {/* Add new period section */}
        {!isAdding ? (
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full h-11 mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 flex items-center justify-center gap-2 text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Ghi nhận kỳ kinh mới / Thay đổi ngày bắt đầu</span>
          </Button>
        ) : (
          <form
            onSubmit={handleAddNewPeriod}
            className="p-4 mb-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                Ghi nhận ngày bắt đầu kỳ kinh mới
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Hủy
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ngày bắt đầu ra máu
              </label>
              <input
                type="date"
                required
                max={todayStr}
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Số ngày hành kinh
                </label>
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={newPeriodDays}
                  onChange={(e) => setNewPeriodDays(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  placeholder="Triệu chứng, lưu ý..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="sm"
              className="w-full h-10 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
            >
              Lưu & Cập nhật Chu kỳ tức thì
            </Button>
          </form>
        )}

        {/* List of past recorded periods */}
        <div className="space-y-2 mb-5">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Các kỳ kinh đã ghi nhận ({logs.length})
          </h3>

          {logs.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              Chưa có dữ liệu kỳ kinh nào.
            </div>
          ) : (
            logs.map((log, index) => {
              const isEditing = editingId === log.id;
              const isLatest = index === 0;

              return (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isLatest
                      ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Chỉnh sửa ngày kinh
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-xs text-slate-400"
                        >
                          Hủy
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={editStartDate}
                          max={todayStr}
                          onChange={(e) => setEditStartDate(e.target.value)}
                          className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(log.id)}
                          className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Lưu
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                          <Droplet className="w-4 h-4 fill-rose-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {log.startDate}
                            </span>
                            {isLatest && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                                Kỳ gần nhất
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Hành kinh: {log.periodDays || 5} ngày
                            {log.notes && ` • ${log.notes}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(log)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="Sửa ngày"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLog(log.id, log.startDate)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Xóa kỳ này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Future Predictions Section */}
        {calculation && calculation.predictedCycles.length > 0 && (
          <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Dự báo các kỳ kinh tiếp theo</span>
            </div>
            <div className="space-y-2">
              {calculation.predictedCycles.map((c) => (
                <div
                  key={c.cycleNumber}
                  className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-purple-100 dark:border-purple-900/50"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Kỳ +{c.cycleNumber}: {c.startDate}
                  </span>
                  <div className="text-[11px] text-purple-600 dark:text-purple-300 font-medium">
                    🌸 Rụng trứng: {c.ovulationDate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
