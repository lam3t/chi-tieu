import { describe, it, expect } from "vitest";
import {
  calculate503020,
  calculateCategoryBudgets,
  calculateCategoryBreakdown,
  calculateDailySpending,
  calculateInsights,
} from "../analytics/calc";
import { Transaction, Category } from "@/types/models";
import { DEFAULT_CATEGORIES } from "../constants";

describe("Analytics Calculation Engine", () => {
  const mockCategories: Category[] = [
    {
      id: "cat_an_uong",
      name: "Ăn uống",
      icon: "Utensils",
      color: "#f97316",
      type: "expense",
      group: "needs",
      monthlyBudget: 3000000,
    },
    {
      id: "cat_cafe",
      name: "Cafe",
      icon: "Coffee",
      color: "#06b6d4",
      type: "expense",
      group: "wants",
      monthlyBudget: 1000000,
    },
    {
      id: "cat_tiet_kiem",
      name: "Tiết kiệm",
      icon: "PiggyBank",
      color: "#10b981",
      type: "expense",
      group: "savings",
      monthlyBudget: 2000000,
    },
    {
      id: "cat_luong",
      name: "Lương",
      icon: "Briefcase",
      color: "#059669",
      type: "income",
      group: "income",
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: "t1",
      type: "income",
      amount: 10000000, // 10 triệu lương
      categoryId: "cat_luong",
      note: "Lương tháng",
      date: "2026-09-05T08:00:00.000Z",
      createdAt: "2026-09-05T08:00:00.000Z",
      updatedAt: "2026-09-05T08:00:00.000Z",
      source: "manual",
    },
    {
      id: "t2",
      type: "expense",
      amount: 2500000, // Needs
      categoryId: "cat_an_uong",
      note: "Siêu thị",
      merchant: "WinMart",
      date: "2026-09-10T08:00:00.000Z",
      createdAt: "2026-09-10T08:00:00.000Z",
      updatedAt: "2026-09-10T08:00:00.000Z",
      source: "manual",
    },
    {
      id: "t3",
      type: "expense",
      amount: 900000, // Wants
      categoryId: "cat_cafe",
      note: "Cafe bạn bè",
      merchant: "Highlands Coffee",
      date: "2026-09-15T08:00:00.000Z",
      createdAt: "2026-09-15T08:00:00.000Z",
      updatedAt: "2026-09-15T08:00:00.000Z",
      source: "manual",
    },
  ];

  it("calculates 50/30/20 proportions accurately", () => {
    const res = calculate503020(mockTransactions, mockCategories);
    expect(res.totalIncome).toBe(10000000);
    expect(res.totalExpense).toBe(3400000);
    expect(res.needs.amount).toBe(2500000); // 25%
    expect(res.needs.percentage).toBe(25);
    expect(res.wants.amount).toBe(900000); // 9%
    expect(res.wants.percentage).toBe(9);
  });

  it("evaluates budget warning at 80% and alert at 100%", () => {
    const res = calculateCategoryBudgets(mockTransactions, mockCategories);
    const anUong = res.find((b) => b.category.id === "cat_an_uong");
    const cafe = res.find((b) => b.category.id === "cat_cafe");

    // Ăn uống: 2.500.000 / 3.000.000 = 83% -> status warning
    expect(anUong?.percentage).toBe(83);
    expect(anUong?.status).toBe("warning");

    // Cafe: 900.000 / 1.000.000 = 90% -> status warning
    expect(cafe?.percentage).toBe(90);
    expect(cafe?.status).toBe("warning");
  });

  it("computes category breakdown and top spenders", () => {
    const { items, top5 } = calculateCategoryBreakdown(mockTransactions, mockCategories);
    expect(items.length).toBe(2);
    expect(items[0].categoryId).toBe("cat_an_uong");
    expect(items[0].amount).toBe(2500000);
    expect(top5.length).toBe(2);
  });

  it("projects daily and month-end spending", () => {
    const daily = calculateDailySpending(mockTransactions, "2026-09");
    expect(daily.totalSpent).toBe(3400000);
    expect(daily.dailyPoints.length).toBe(30); // September has 30 days
  });

  it("generates rule-based insights for biggest expense", () => {
    const insights = calculateInsights(mockTransactions, [], mockCategories);
    const biggest = insights.find((i) => i.id === "biggest-expense");
    expect(biggest).toBeDefined();
    expect(biggest?.message).toContain("2.500.000");
  });
});
