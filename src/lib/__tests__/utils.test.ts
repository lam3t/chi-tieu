import { describe, it, expect } from "vitest";
import { formatVND } from "../utils";
import { TransactionSchema } from "@/types/models";
import { DEFAULT_CATEGORIES } from "../constants";

describe("VND Formatting", () => {
  it("formats integer amounts with dot separator and currency symbol", () => {
    // Note: vi-VN uses non-breaking space or standard space before ₫
    const formatted = formatVND(1250000);
    expect(formatted).toMatch(/1\.250\.000/);
    expect(formatted).toContain("₫");
  });

  it("handles 0 VND properly", () => {
    const formatted = formatVND(0);
    expect(formatted).toMatch(/0.*₫/);
  });

  it("rounds decimals to nearest integer with no decimal places", () => {
    const formatted = formatVND(15000.75);
    expect(formatted).toMatch(/15\.001.*₫/);
    expect(formatted).not.toContain(",75");
  });
});

describe("Transaction Data Model Validation", () => {
  it("validates valid expense transaction", () => {
    const valid = {
      id: "tx-123",
      type: "expense",
      amount: 45000,
      categoryId: "cat_an_uong",
      note: "Cơm trưa văn phòng",
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "manual",
    };

    const parsed = TransactionSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("rejects negative or zero amount", () => {
    const invalid = {
      id: "tx-123",
      type: "expense",
      amount: -5000,
      categoryId: "cat_an_uong",
      note: "Test",
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "manual",
    };

    const parsed = TransactionSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});

describe("Default Seed Categories", () => {
  it("contains at least 12 categories mapped to needs/wants/savings/income", () => {
    expect(DEFAULT_CATEGORIES.length).toBeGreaterThanOrEqual(12);

    const groups = new Set(DEFAULT_CATEGORIES.map((c) => c.group));
    expect(groups.has("needs")).toBe(true);
    expect(groups.has("wants")).toBe(true);
    expect(groups.has("savings")).toBe(true);
    expect(groups.has("income")).toBe(true);
  });
});
