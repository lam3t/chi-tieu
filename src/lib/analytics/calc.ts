import { Transaction, Category, Settings, CategoryGroup } from "@/types/models";

export interface Rule503020Result {
  needs: { amount: number; percentage: number; target: number };
  wants: { amount: number; percentage: number; target: number };
  savings: { amount: number; percentage: number; target: number };
  totalExpense: number;
  totalIncome: number;
}

export interface CategoryBudgetStatus {
  category: Category;
  spent: number;
  budget: number;
  percentage: number;
  status: "normal" | "warning" | "alert"; // <80%, 80-99%, >=100%
}

export interface CategorySpendingShare {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

export interface MerchantSpending {
  merchant: string;
  amount: number;
  count: number;
}

export interface MonthlyTrendPoint {
  monthKey: string; // YYYY-MM
  displayMonth: string; // T08, T09...
  income: number;
  expense: number;
  savingsRate: number;
}

export interface DailySpendingData {
  dailyPoints: { day: number; amount: number }[];
  totalSpent: number;
  averagePerDay: number;
  projectedMonthEnd: number;
  daysPassed: number;
  totalDaysInMonth: number;
}

export interface FinancialInsight {
  id: string;
  type: "warning" | "info" | "success";
  title: string;
  message: string;
}

/**
 * 1. Rule 50/30/20 breakdown
 */
export function calculate503020(
  transactions: Transaction[],
  categories: Category[]
): Rule503020Result {
  const catMap = new Map<string, Category>();
  categories.forEach((c) => catMap.set(c.id, c));

  let totalIncome = 0;
  let totalExpense = 0;
  let needsAmount = 0;
  let wantsAmount = 0;
  let savingsAmount = 0;

  for (const t of transactions) {
    if (t.deletedAt) continue;

    if (t.type === "income") {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      const cat = catMap.get(t.categoryId);
      const group: CategoryGroup = cat?.group || "needs";

      if (group === "needs") {
        needsAmount += t.amount;
      } else if (group === "wants") {
        wantsAmount += t.amount;
      } else if (group === "savings") {
        savingsAmount += t.amount;
      }
    }
  }

  // Base for percentages: use totalIncome if available, otherwise totalExpense
  const base = totalIncome > 0 ? totalIncome : totalExpense || 1;

  return {
    needs: {
      amount: needsAmount,
      percentage: Math.round((needsAmount / base) * 100),
      target: 50,
    },
    wants: {
      amount: wantsAmount,
      percentage: Math.round((wantsAmount / base) * 100),
      target: 30,
    },
    savings: {
      amount: savingsAmount,
      percentage: Math.round((savingsAmount / base) * 100),
      target: 20,
    },
    totalExpense,
    totalIncome,
  };
}

/**
 * 2. Budget vs Actual per category
 */
export function calculateCategoryBudgets(
  transactions: Transaction[],
  categories: Category[]
): CategoryBudgetStatus[] {
  const spentMap = new Map<string, number>();

  for (const t of transactions) {
    if (t.deletedAt || t.type !== "expense") continue;
    spentMap.set(t.categoryId, (spentMap.get(t.categoryId) || 0) + t.amount);
  }

  const result: CategoryBudgetStatus[] = [];

  for (const cat of categories) {
    if (cat.type !== "expense" || !cat.monthlyBudget || cat.monthlyBudget <= 0) {
      continue;
    }

    const spent = spentMap.get(cat.id) || 0;
    const percentage = Math.round((spent / cat.monthlyBudget) * 100);

    let status: "normal" | "warning" | "alert" = "normal";
    if (percentage >= 100) {
      status = "alert";
    } else if (percentage >= 80) {
      status = "warning";
    }

    result.push({
      category: cat,
      spent,
      budget: cat.monthlyBudget,
      percentage,
      status,
    });
  }

  return result.sort((a, b) => b.percentage - a.percentage);
}

/**
 * 3. Spending by Category & Top 5
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[]
): {
  items: CategorySpendingShare[];
  top5: CategorySpendingShare[];
} {
  const catMap = new Map<string, Category>();
  categories.forEach((c) => catMap.set(c.id, c));

  const spentMap = new Map<string, number>();
  let totalExpense = 0;

  for (const t of transactions) {
    if (t.deletedAt || t.type !== "expense") continue;
    spentMap.set(t.categoryId, (spentMap.get(t.categoryId) || 0) + t.amount);
    totalExpense += t.amount;
  }

  const items: CategorySpendingShare[] = [];

  spentMap.forEach((amount, catId) => {
    const cat = catMap.get(catId);
    items.push({
      categoryId: catId,
      name: cat?.name || "Khác",
      color: cat?.color || "#64748b",
      icon: cat?.icon || "Tag",
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    });
  });

  items.sort((a, b) => b.amount - a.amount);
  const top5 = items.slice(0, 5);

  return { items, top5 };
}

/**
 * Top Merchants
 */
export function calculateTopMerchants(
  transactions: Transaction[],
  limit = 5
): MerchantSpending[] {
  const map = new Map<string, { amount: number; count: number }>();

  for (const t of transactions) {
    if (t.deletedAt || t.type !== "expense" || !t.merchant) continue;
    const name = t.merchant.trim();
    if (!name) continue;

    const cur = map.get(name) || { amount: 0, count: 0 };
    cur.amount += t.amount;
    cur.count += 1;
    map.set(name, cur);
  }

  return Array.from(map.entries())
    .map(([merchant, val]) => ({
      merchant,
      amount: val.amount,
      count: val.count,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

/**
 * 4. Trend (6 months)
 */
export function calculateTrend(
  allTransactions: Transaction[],
  selectedMonthKey: string,
  numMonths = 6
): MonthlyTrendPoint[] {
  const [targetYear, targetMonth] = selectedMonthKey.split("-").map(Number);
  const monthKeys: string[] = [];

  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(targetYear, targetMonth - 1 - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    monthKeys.push(`${y}-${m}`);
  }

  const points: MonthlyTrendPoint[] = monthKeys.map((mk) => {
    const [, m] = mk.split("-");
    let income = 0;
    let expense = 0;

    allTransactions.forEach((t) => {
      if (t.deletedAt) return;
      if (t.date.startsWith(mk)) {
        if (t.type === "income") income += t.amount;
        else expense += t.amount;
      }
    });

    const net = income - expense;
    const rate = income > 0 ? Math.max(0, Math.round((net / income) * 100)) : 0;

    return {
      monthKey: mk,
      displayMonth: `T${parseInt(m, 10)}`,
      income,
      expense,
      savingsRate: rate,
    };
  });

  return points;
}

/**
 * 5. Daily spending & projections
 */
export function calculateDailySpending(
  transactions: Transaction[],
  monthKey: string
): DailySpendingData {
  const [year, month] = monthKey.split("-").map(Number);
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  const now = new Date();
  const currentMonthKey = now.toISOString().slice(0, 7);
  const daysPassed =
    monthKey === currentMonthKey
      ? Math.min(now.getDate(), totalDaysInMonth)
      : totalDaysInMonth;

  const dayAmounts: Record<number, number> = {};
  for (let d = 1; d <= totalDaysInMonth; d++) {
    dayAmounts[d] = 0;
  }

  let totalSpent = 0;
  for (const t of transactions) {
    if (t.deletedAt || t.type !== "expense") continue;
    const day = new Date(t.date).getDate();
    if (dayAmounts[day] !== undefined) {
      dayAmounts[day] += t.amount;
      totalSpent += t.amount;
    }
  }

  const averagePerDay = daysPassed > 0 ? Math.round(totalSpent / daysPassed) : 0;
  const projectedMonthEnd = Math.round(averagePerDay * totalDaysInMonth);

  const dailyPoints = Object.entries(dayAmounts).map(([d, amount]) => ({
    day: parseInt(d, 10),
    amount,
  }));

  return {
    dailyPoints,
    totalSpent,
    averagePerDay,
    projectedMonthEnd,
    daysPassed,
    totalDaysInMonth,
  };
}

/**
 * 6. Rule-based Financial Insights
 */
export function calculateInsights(
  currentTransactions: Transaction[],
  past3MonthsTransactions: Transaction[],
  categories: Category[],
  settings?: Settings
): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  const catMap = new Map<string, Category>();
  categories.forEach((c) => catMap.set(c.id, c));

  let currentExpense = 0;
  let currentIncome = 0;
  let biggestExpense: Transaction | null = null;
  const currentCatSpend = new Map<string, number>();

  for (const t of currentTransactions) {
    if (t.deletedAt) continue;
    if (t.type === "income") {
      currentIncome += t.amount;
    } else {
      currentExpense += t.amount;
      currentCatSpend.set(
        t.categoryId,
        (currentCatSpend.get(t.categoryId) || 0) + t.amount
      );
      if (!biggestExpense || t.amount > biggestExpense.amount) {
        biggestExpense = t;
      }
    }
  }

  // 1. Biggest single expense
  if (biggestExpense && biggestExpense.amount > 0) {
    const cat = catMap.get(biggestExpense.categoryId);
    insights.push({
      id: "biggest-expense",
      type: "info",
      title: "Khoản chi lớn nhất",
      message: `${biggestExpense.note || cat?.name || "Chi tiêu"}: ${new Intl.NumberFormat("vi-VN").format(biggestExpense.amount)} ₫ (${new Date(biggestExpense.date).toLocaleDateString("vi-VN")})`,
    });
  }

  // 2. Pace check vs Budget
  const totalBudget = categories.reduce(
    (sum, c) => sum + (c.type === "expense" ? c.monthlyBudget || 0 : 0),
    0
  );
  if (totalBudget > 0) {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayPassed = now.getDate();
    const timePercentage = Math.round((dayPassed / daysInMonth) * 100);
    const budgetPercentage = Math.round((currentExpense / totalBudget) * 100);

    if (budgetPercentage > timePercentage + 15) {
      insights.push({
        id: "pace-warning",
        type: "warning",
        title: "Tốc độ chi tiêu vượt tiến độ",
        message: `Bạn đã chi ${budgetPercentage}% tổng ngân sách khi mới qua ${timePercentage}% tháng. Hãy cân nhắc thắt chặt chi tiêu linh hoạt!`,
      });
    } else if (budgetPercentage <= timePercentage) {
      insights.push({
        id: "pace-good",
        type: "success",
        title: "Kiểm soát chi tiêu tốt",
        message: `Tốc độ chi tiêu (${budgetPercentage}%) đang thấp hơn hoặc bằng tiến độ thời gian (${timePercentage}% tháng).`,
      });
    }
  }

  // 3. Spike vs 3-month average
  if (past3MonthsTransactions.length > 0) {
    const pastCatTotal = new Map<string, number>();
    for (const t of past3MonthsTransactions) {
      if (t.deletedAt || t.type !== "expense") continue;
      pastCatTotal.set(
        t.categoryId,
        (pastCatTotal.get(t.categoryId) || 0) + t.amount
      );
    }

    currentCatSpend.forEach((amount, catId) => {
      const pastTotal = pastCatTotal.get(catId) || 0;
      const pastMonthlyAvg = pastTotal / 3;
      if (pastMonthlyAvg > 200000 && amount > pastMonthlyAvg * 1.35) {
        const cat = catMap.get(catId);
        insights.push({
          id: `spike-${catId}`,
          type: "warning",
          title: `Tăng đột biến: ${cat?.name || "Danh mục"}`,
          message: `Chi tiêu mục này cao hơn ${Math.round((amount / pastMonthlyAvg - 1) * 100)}% so với mức trung bình 3 tháng trước.`,
        });
      }
    });
  }

  // 4. Recurring / subscription detection (same merchant with similar amounts)
  const merchantMonths = new Map<string, Set<string>>();
  const allTxs = [...currentTransactions, ...past3MonthsTransactions];
  for (const t of allTxs) {
    if (t.deletedAt || t.type !== "expense" || !t.merchant) continue;
    const m = t.merchant.trim();
    if (!m) continue;
    const mk = t.date.slice(0, 7);
    if (!merchantMonths.has(m)) merchantMonths.set(m, new Set());
    merchantMonths.get(m)!.add(mk);
  }

  merchantMonths.forEach((months, merchant) => {
    if (months.size >= 2) {
      insights.push({
        id: `recurring-${merchant}`,
        type: "info",
        title: "Chi phí định kỳ / Đăng ký",
        message: `Phát hiện giao dịch định kỳ hàng tháng tại "${merchant}".`,
      });
    }
  });

  return insights.slice(0, 6);
}
