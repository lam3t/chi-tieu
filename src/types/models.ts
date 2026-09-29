import { z } from "zod";

export const TransactionTypeSchema = z.enum(["expense", "income"]);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const CategoryGroupSchema = z.enum(["needs", "wants", "savings", "income"]);
export type CategoryGroup = z.infer<typeof CategoryGroupSchema>;

export const TransactionSourceSchema = z.enum(["manual", "ocr"]);
export type TransactionSource = z.infer<typeof TransactionSourceSchema>;

export const TransactionSchema = z.object({
  id: z.string(),
  type: TransactionTypeSchema,
  amount: z.number().int().positive({ message: "Số tiền phải lớn hơn 0" }),
  categoryId: z.string().min(1, { message: "Vui lòng chọn hạng mục" }),
  note: z.string().default(""),
  merchant: z.string().optional(),
  date: z.string(), // ISO 8601 string
  createdAt: z.string(), // ISO string
  updatedAt: z.string(), // ISO string
  deletedAt: z.string().nullable().optional(), // ISO tombstone
  source: TransactionSourceSchema.default("manual"),
  receiptFileId: z.string().optional(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: "Tên hạng mục không được để trống" }),
  icon: z.string().default("Tag"),
  color: z.string().default("#10b981"),
  type: TransactionTypeSchema,
  group: CategoryGroupSchema,
  monthlyBudget: z.number().int().nonnegative().optional(),
});
export type Category = z.infer<typeof CategorySchema>;

export const SettingsSchema = z.object({
  currency: z.literal("VND").default("VND"),
  monthStartDay: z.number().int().min(1).max(28).default(1),
  budgetRule: z.literal("50/30/20").default("50/30/20"),
  emergencyFundTarget: z.number().int().nonnegative().optional(),
  saveReceiptImages: z.boolean().default(false),
  updatedAt: z.string().optional(),
});
export type Settings = z.infer<typeof SettingsSchema>;

export interface SyncJob {
  id?: number;
  type: "meta" | "month";
  monthKey?: string; // YYYY-MM
  status: "pending" | "syncing" | "failed";
  retryCount: number;
  createdAt: number;
  lastAttemptAt?: number;
  error?: string;
}
