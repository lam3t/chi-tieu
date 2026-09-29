import { describe, it, expect } from "vitest";
import { OCRResultSchema } from "@/types/ocr";

describe("OCR Result Zod Schema Validation", () => {
  it("validates successful receipt OCR response", () => {
    const rawAiOutput = {
      amount: 1250000,
      currency: "VND",
      date: "2026-09-29",
      merchant: "Highlands Coffee",
      type: "expense",
      categoryGuess: "cat_cafe",
      confidence: 0.95,
      rawText: "Hóa đơn thanh toán Highlands Coffee 1.250.000đ",
    };

    const parsed = OCRResultSchema.safeParse(rawAiOutput);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.amount).toBe(1250000);
      expect(parsed.data.categoryGuess).toBe("cat_cafe");
    }
  });

  it("handles null date gracefully", () => {
    const rawAiOutput = {
      amount: 45000,
      currency: "VND",
      date: null,
      merchant: "Cơm Tấm",
      type: "expense",
      categoryGuess: "cat_an_uong",
      confidence: 0.8,
      rawText: "45.000đ",
    };

    const parsed = OCRResultSchema.safeParse(rawAiOutput);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.date).toBeNull();
    }
  });

  it("rejects non-positive amounts", () => {
    const rawAiOutput = {
      amount: 0,
      currency: "VND",
      date: "2026-09-29",
      merchant: "Test",
      type: "expense",
      categoryGuess: "cat_an_uong",
      confidence: 0.5,
      rawText: "0đ",
    };

    const parsed = OCRResultSchema.safeParse(rawAiOutput);
    expect(parsed.success).toBe(false);
  });
});
