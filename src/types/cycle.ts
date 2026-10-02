import { z } from "zod";

export const FertilityLevelSchema = z.enum(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "PEAK"]);
export type FertilityLevel = z.infer<typeof FertilityLevelSchema>;

export const CyclePhaseSchema = z.enum([
  "MENSTRUATION", // Hành kinh
  "FOLLICULAR",   // Nang noãn (trước rụng trứng)
  "FERTILE",      // Cửa sổ thụ thai
  "OVULATION",    // Ngày rụng trứng
  "LUTEAL",       // Hoàng thể (sau rụng trứng)
]);
export type CyclePhase = z.infer<typeof CyclePhaseSchema>;

export interface DailySymptom {
  cramps?: "none" | "mild" | "moderate" | "severe";
  flow?: "spotting" | "light" | "medium" | "heavy";
  mood?: "happy" | "calm" | "sensitive" | "irritable" | "tired";
  notes?: string;
}

export interface MenstrualCycleLog {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD (optional, last day of bleeding)
  periodDays?: number; // số ngày hành kinh thực tế của chu kỳ đó
  cycleLength?: number; // độ dài chu kỳ (tính từ ngày bắt đầu kỳ này đến kỳ tiếp theo)
  symptoms?: Record<string, DailySymptom>; // key: YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenstrualSettings {
  key: "menstrual_settings";
  cycleLength: number; // Mặc định 28
  periodLength: number; // Mặc định 5
  lutealPhase: number;  // Mặc định 14
  setupCompleted: boolean;
  goal?: "track" | "conceive" | "avoid"; // Mục tiêu: Theo dõi, Muốn thụ thai, hoặc Tránh thai tự nhiên
  updatedAt: string;
}

export interface DayCycleInfo {
  date: string; // YYYY-MM-DD
  dayOfCycle: number; // 1 to cycleLength
  phase: CyclePhase;
  phaseLabel: string;
  fertilityLevel: FertilityLevel;
  fertilityPercentage: number; // 0 - 100%
  description: string;
  advice: string;
  isMenstruation: boolean;
  isOvulation: boolean;
  isFertileWindow: boolean;
  isToday: boolean;
}

export interface CycleCalculationResult {
  currentCycleDay: number;
  totalCycleLength: number;
  periodLength: number;
  cycleStartDate: string;
  nextPeriodDate: string;
  ovulationDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  todayInfo: DayCycleInfo;
  daysUntilNextPeriod: number;
  daysUntilOvulation: number;
  isPeriodLate: boolean;
  lateDays: number;
  predictedCycles: {
    cycleNumber: number;
    startDate: string;
    endDate: string;
    ovulationDate: string;
    fertileWindowStart: string;
    fertileWindowEnd: string;
  }[];
}
