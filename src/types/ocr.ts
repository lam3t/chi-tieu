import { z } from "zod";

export const OCRResultSchema = z.object({
  amount: z.number().int().positive({ message: "Số tiền nhận diện phải lớn hơn 0" }),
  currency: z.string().default("VND"),
  date: z.string().nullable(), // YYYY-MM-DD or ISO string
  merchant: z.string().default(""),
  type: z.enum(["expense", "income"]).default("expense"),
  categoryGuess: z.string().default("cat_an_uong"),
  confidence: z.number().min(0).max(1).default(0.8),
  rawText: z.string().default(""),
});

export type OCRResult = z.infer<typeof OCRResultSchema>;

export interface OCRItemReview {
  id: string;
  imagePreviewUrl: string;
  file: File;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
  result?: OCRResult;
}
