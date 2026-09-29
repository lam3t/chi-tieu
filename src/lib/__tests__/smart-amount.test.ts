import { describe, it, expect } from "vitest";
import { getSmartAmountSuggestions } from "../analytics/smart-amount";

describe("Smart Amount Autocomplete Suggestions", () => {
  it("suggests 35k (35.000 ₫) when user enters '35'", () => {
    const suggestions = getSmartAmountSuggestions("35");
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].amount).toBe(35000);
    expect(suggestions[0].primary).toBe(true);
    expect(suggestions.some((s) => s.amount === 350000)).toBe(true);
  });

  it("suggests 20k, 200k, 2Tr when user enters '2'", () => {
    const suggestions = getSmartAmountSuggestions("2");
    expect(suggestions.map((s) => s.amount)).toContain(20000);
    expect(suggestions.map((s) => s.amount)).toContain(200000);
    expect(suggestions.map((s) => s.amount)).toContain(2000000);
  });

  it("suggests 1.500.000 ₫ when user enters '1500'", () => {
    const suggestions = getSmartAmountSuggestions("1500");
    expect(suggestions[0].amount).toBe(1500000);
  });

  it("suggests frequent category amounts when input is '0'", () => {
    const frequent = [45000, 60000, 120000];
    const suggestions = getSmartAmountSuggestions("0", frequent);
    expect(suggestions[0].amount).toBe(45000);
    expect(suggestions[0].badge).toBe("Thường chi");
  });
});
