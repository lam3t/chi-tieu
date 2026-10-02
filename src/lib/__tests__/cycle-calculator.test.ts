import { describe, it, expect } from "vitest";
import {
  calculateDayCycleInfo,
  calculateCycleResult,
  calculateAverageCycleLength,
  addDays,
  diffDays,
} from "../cycle/calculator";

describe("Menstrual Cycle Calculator", () => {
  it("calculates correct dates for a standard 28-day cycle", () => {
    const startDate = "2026-10-01";
    const result = calculateCycleResult(startDate, 28, 5, 14, "2026-10-01");

    expect(result.cycleStartDate).toBe("2026-10-01");
    // Next period = 2026-10-01 + 28 days = 2026-10-29
    expect(result.nextPeriodDate).toBe("2026-10-29");
    // Ovulation = 2026-10-01 + (28 - 14) = 2026-10-15
    expect(result.ovulationDate).toBe("2026-10-15");
    // Fertile window: 2026-10-10 to 2026-10-16
    expect(result.fertileWindowStart).toBe("2026-10-10");
    expect(result.fertileWindowEnd).toBe("2026-10-16");
    expect(result.currentCycleDay).toBe(1);
    expect(result.isPeriodLate).toBe(false);
  });

  it("calculates high and peak conception probability during fertile window", () => {
    const startDate = "2026-10-01";
    // Ovulation is 2026-10-15
    // Day before ovulation (2026-10-14) should have peak probability ~35%
    const peakDay = calculateDayCycleInfo("2026-10-14", startDate, 28, 5, 14);
    expect(peakDay.fertilityPercentage).toBe(35);
    expect(peakDay.fertilityLevel).toBe("PEAK");
    expect(peakDay.isFertileWindow).toBe(true);

    // Ovulation day itself (2026-10-15)
    const ovDay = calculateDayCycleInfo("2026-10-15", startDate, 28, 5, 14);
    expect(ovDay.fertilityPercentage).toBe(30);
    expect(ovDay.fertilityLevel).toBe("PEAK");
    expect(ovDay.isOvulation).toBe(true);

    // 2 days before ovulation (2026-10-13)
    const highDay = calculateDayCycleInfo("2026-10-13", startDate, 28, 5, 14);
    expect(highDay.fertilityPercentage).toBe(28);
    expect(highDay.fertilityLevel).toBe("HIGH");

    // Menstruation day (2026-10-02)
    const periodDay = calculateDayCycleInfo("2026-10-02", startDate, 28, 5, 14);
    expect(periodDay.isMenstruation).toBe(true);
    expect(periodDay.fertilityPercentage).toBeLessThanOrEqual(2);
    expect(periodDay.fertilityLevel).toBe("VERY_LOW");

    // Luteal phase (2026-10-22) - Safe phase
    const safeDay = calculateDayCycleInfo("2026-10-22", startDate, 28, 5, 14);
    expect(safeDay.phase).toBe("LUTEAL");
    expect(safeDay.fertilityPercentage).toBe(1);
    expect(safeDay.fertilityLevel).toBe("VERY_LOW");
  });

  it("accurately detects late period when current date exceeds cycle length", () => {
    const startDate = "2026-09-01";
    // 35 days later (2026-10-06)
    const result = calculateCycleResult(startDate, 28, 5, 14, "2026-10-06");
    expect(result.isPeriodLate).toBe(true);
    expect(result.lateDays).toBe(7); // 35 - 28 = 7 days late
  });

  it("calculates average cycle length correctly from multiple logs", () => {
    const logs = [
      { id: "1", startDate: "2026-07-01", createdAt: "", updatedAt: "" },
      { id: "2", startDate: "2026-07-29", createdAt: "", updatedAt: "" }, // 28 days
      { id: "3", startDate: "2026-08-28", createdAt: "", updatedAt: "" }, // 30 days
      { id: "4", startDate: "2026-09-26", createdAt: "", updatedAt: "" }, // 29 days
    ];
    const avg = calculateAverageCycleLength(logs, 28);
    // (28 + 30 + 29) / 3 = 29
    expect(avg).toBe(29);
  });

  it("updates cycle predictions instantly when a new period date is entered", () => {
    // Original start: 2026-09-01
    const original = calculateCycleResult("2026-09-01", 28, 5, 14, "2026-09-15");
    expect(original.cycleStartDate).toBe("2026-09-01");

    // User updates new period arrived on 2026-09-29
    const updated = calculateCycleResult("2026-09-29", 28, 5, 14, "2026-10-02");
    expect(updated.cycleStartDate).toBe("2026-09-29");
    expect(updated.currentCycleDay).toBe(4);
    expect(updated.nextPeriodDate).toBe("2026-10-27");
    expect(updated.ovulationDate).toBe("2026-10-13");
  });
});
