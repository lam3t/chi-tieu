import { formatVND } from "@/lib/utils";

export interface SmartAmountSuggestion {
  label: string;
  amount: number;
  badge?: string;
  primary?: boolean;
}

/**
 * Returns smart amount autocomplete suggestions tailored for Vietnamese currency habits.
 */
export function getSmartAmountSuggestions(
  inputStr: string,
  frequentAmounts: number[] = [],
  type: "expense" | "income" = "expense"
): SmartAmountSuggestion[] {
  const cleanStr = inputStr.replace(/\D/g, "");
  const num = parseInt(cleanStr, 10) || 0;

  // Case 1: Amount is 0 or empty -> Show frequent amounts or common denominations
  if (num === 0) {
    if (frequentAmounts.length > 0) {
      return frequentAmounts.map((amt, idx) => ({
        label: formatVND(amt),
        amount: amt,
        badge: idx === 0 ? "Thường chi" : undefined,
        primary: idx === 0,
      }));
    }

    if (type === "income") {
      return [
        { label: "5 Tr", amount: 5000000 },
        { label: "10 Tr", amount: 10000000, primary: true },
        { label: "15 Tr", amount: 15000000 },
        { label: "20 Tr", amount: 20000000 },
        { label: "30 Tr", amount: 30000000 },
      ];
    }

    // Default common expense denominations in Vietnam
    return [
      { label: "30k", amount: 30000 },
      { label: "50k", amount: 50000, primary: true },
      { label: "100k", amount: 100000 },
      { label: "200k", amount: 200000 },
      { label: "500k", amount: 500000 },
    ];
  }

  const suggestions: SmartAmountSuggestion[] = [];

  // Case 2: User typed 1 digit (1 - 9)
  if (num >= 1 && num <= 9) {
    suggestions.push(
      { label: `${num}0k`, amount: num * 10000, badge: "Chục nghìn" },
      { label: `${num}00k`, amount: num * 100000, badge: "Trăm nghìn" },
      { label: `${num} Tr`, amount: num * 1000000, badge: "Triệu", primary: true },
      { label: `${num}0 Tr`, amount: num * 10000000, badge: "Chục triệu" }
    );
    return suggestions;
  }

  // Case 3: User typed 2 or 3 digits (< 1000, e.g. 25, 35, 120, 250)
  if (num < 1000) {
    // 35 -> 35.000 ₫ (most common Vietnamese typing habit: "35" means 35k)
    suggestions.push({
      label: `${num}k (${formatVND(num * 1000)})`,
      amount: num * 1000,
      badge: "Nghìn (k)",
      primary: true,
    });

    // 35 -> 350.000 ₫
    suggestions.push({
      label: `${formatVND(num * 10000)}`,
      amount: num * 10000,
    });

    // 35 -> 3.500.000 ₫
    suggestions.push({
      label: `${formatVND(num * 100000)}`,
      amount: num * 100000,
    });

    // 35 -> 35.000.000 ₫
    suggestions.push({
      label: `${num} Tr (${formatVND(num * 1000000)})`,
      amount: num * 1000000,
      badge: "Triệu",
    });

    return suggestions;
  }

  // Case 4: User typed 4 digits (e.g. 1500, 2500, 3200)
  if (num >= 1000 && num < 10000) {
    // 1500 -> 1.500.000 ₫
    suggestions.push({
      label: `${formatVND(num * 1000)}`,
      amount: num * 1000,
      badge: "Triệu",
      primary: true,
    });
    suggestions.push({
      label: `${formatVND(num * 10000)}`,
      amount: num * 10000,
      badge: "Chục triệu",
    });
    return suggestions;
  }

  // Case 5: User typed complete amount (e.g. 50000, 120000)
  // Offer quick roundings or additions (+10k, +50k, +100k)
  if (num >= 10000) {
    suggestions.push(
      { label: `+ 10k (${formatVND(num + 10000)})`, amount: num + 10000 },
      { label: `+ 50k (${formatVND(num + 50000)})`, amount: num + 50000 },
      { label: `+ 100k (${formatVND(num + 100000)})`, amount: num + 100000 },
      { label: `x 2 (${formatVND(num * 2)})`, amount: num * 2 }
    );
  }

  return suggestions;
}
