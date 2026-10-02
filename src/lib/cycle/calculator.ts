import {
  CyclePhase,
  FertilityLevel,
  DayCycleInfo,
  CycleCalculationResult,
  MenstrualCycleLog,
} from "@/types/cycle";

// Helper: Normalize date to YYYY-MM-DD
export function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0); // Noon to avoid timezone shift issues
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateString(d);
}

export function diffDays(dateStrA: string, dateStrB: string): number {
  const a = parseDateString(dateStrA);
  const b = parseDateString(dateStrB);
  const msDiff = a.getTime() - b.getTime();
  return Math.round(msDiff / (1000 * 60 * 60 * 24));
}

/**
 * Calculates conception probability percentage and phase information for a specific target day
 * based on cycle start date and cycle parameters.
 */
export function calculateDayCycleInfo(
  targetDateStr: string,
  cycleStartDateStr: string,
  cycleLength: number = 28,
  periodLength: number = 5,
  lutealPhase: number = 14
): DayCycleInfo {
  const daysDiff = diffDays(targetDateStr, cycleStartDateStr);
  // dayOfCycle: 1-indexed (Day 1 is start date)
  // If targetDate is within current cycle: 1 to cycleLength
  // If normalized within cycle:
  let dayOfCycle = (daysDiff % cycleLength) + 1;
  if (dayOfCycle <= 0) {
    dayOfCycle += cycleLength;
  }

  // Ovulation day relative to start date (1-indexed)
  // Usually cycleLength - lutealPhase + 1 (e.g. for 28-day cycle with 14-day luteal phase, Day 15)
  const ovulationDayOfCycle = Math.max(1, cycleLength - lutealPhase + 1);

  const isMenstruation = dayOfCycle >= 1 && dayOfCycle <= periodLength;
  const isOvulation = dayOfCycle === ovulationDayOfCycle;

  // Fertile window is from (ovulation - 5) to (ovulation + 1)
  const fertileWindowStartDay = Math.max(1, ovulationDayOfCycle - 5);
  const fertileWindowEndDay = ovulationDayOfCycle + 1;
  const isFertileWindow = dayOfCycle >= fertileWindowStartDay && dayOfCycle <= fertileWindowEndDay;

  // Determine biological phase
  let phase: CyclePhase = "FOLLICULAR";
  let phaseLabel = "Pha nang noãn";

  if (isMenstruation) {
    phase = "MENSTRUATION";
    phaseLabel = "Giai đoạn hành kinh";
  } else if (isOvulation) {
    phase = "OVULATION";
    phaseLabel = "Ngày rụng trứng";
  } else if (isFertileWindow) {
    phase = "FERTILE";
    phaseLabel = "Cửa sổ thụ thai";
  } else if (dayOfCycle > fertileWindowEndDay) {
    phase = "LUTEAL";
    phaseLabel = "Pha hoàng thể (An toàn)";
  } else {
    phase = "FOLLICULAR";
    phaseLabel = "Pha nang noãn (Trước rụng trứng)";
  }

  // Calculate conception probability %
  // Based on clinical studies by Wilcox et al. (NEJM / Human Reproduction)
  const daysFromOvulation = dayOfCycle - ovulationDayOfCycle;
  let fertilityPercentage = 1;
  let fertilityLevel: FertilityLevel = "VERY_LOW";
  let description = "Khả năng thụ thai rất thấp (vùng an toàn).";
  let advice = "Giai đoạn ít có nguy cơ mang thai nhất nếu quan hệ tự nhiên.";

  if (isMenstruation) {
    fertilityPercentage = dayOfCycle <= 2 ? 1 : 2;
    fertilityLevel = "VERY_LOW";
    description = "Giai đoạn kinh nguyệt, tử cung đang bong niêm mạc.";
    advice = "Khả năng thụ thai cực thấp, hãy giữ vệ sinh và nghỉ ngơi hợp lý.";
  } else if (daysFromOvulation === -5) {
    fertilityPercentage = 10;
    fertilityLevel = "LOW";
    description = "Bắt đầu cửa sổ thụ thai (tinh trùng có thể sống tới 5 ngày).";
    advice = "Nếu chưa muốn có thai, nên sử dụng biện pháp bảo vệ từ thời điểm này.";
  } else if (daysFromOvulation === -4) {
    fertilityPercentage = 16;
    fertilityLevel = "MEDIUM";
    description = "Cửa sổ thụ thai: Khả năng thụ tinh tăng dần.";
    advice = "Khả năng thụ thai ở mức trung bình. Hãy bảo vệ nếu chưa có kế hoạch sinh con.";
  } else if (daysFromOvulation === -3) {
    fertilityPercentage = 22;
    fertilityLevel = "MEDIUM";
    description = "Cửa sổ thụ thai: Gần sát thời điểm rụng trứng.";
    advice = "Thời điểm thuận lợi nếu bạn muốn có em bé.";
  } else if (daysFromOvulation === -2) {
    fertilityPercentage = 28;
    fertilityLevel = "HIGH";
    description = "Cửa sổ thụ thai rất cao: Tinh trùng sẵn sàng đón trứng.";
    advice = "Thời điểm vàng để thụ thai! Cần bảo vệ cẩn thận nếu tránh thai.";
  } else if (daysFromOvulation === -1) {
    fertilityPercentage = 35;
    fertilityLevel = "PEAK";
    description = "Đỉnh điểm thụ thai: 24 giờ trước khi trứng rụng!";
    advice = "Xác suất thụ thai cao nhất trong toàn bộ chu kỳ kinh nguyệt (~35%).";
  } else if (daysFromOvulation === 0) {
    fertilityPercentage = 30;
    fertilityLevel = "PEAK";
    description = "Ngày rụng trứng: Nang trứng vỡ và giải phóng noãn.";
    advice = "Cơ hội thụ thai rất cao. Trứng có khả năng sống khoảng 12-24 giờ.";
  } else if (daysFromOvulation === 1) {
    fertilityPercentage = 8;
    fertilityLevel = "LOW";
    description = "Sau rụng trứng: Noãn bắt đầu thoái hóa nếu chưa thụ tinh.";
    advice = "Khả năng thụ thai giảm mạnh, sắp bước vào giai đoạn an toàn.";
  } else if (daysFromOvulation > 1) {
    fertilityPercentage = 1;
    fertilityLevel = "VERY_LOW";
    description = "Pha hoàng thể: Trứng đã thoái hóa, hoàng thể tiết Progesterone.";
    advice = "Giai đoạn an toàn tự nhiên, khả năng thụ thai hầu như bằng không (<1%).";
  } else {
    // Follicular phase before fertile window
    fertilityPercentage = 5;
    fertilityLevel = "LOW";
    description = "Pha nang noãn: Nang trứng đang phát triển trong buồng trứng.";
    advice = "Khả năng thụ thai thấp nhưng tinh trùng có thể sống chờ ngày rụng trứng.";
  }

  const todayStr = formatDateString(new Date());

  return {
    date: targetDateStr,
    dayOfCycle,
    phase,
    phaseLabel,
    fertilityLevel,
    fertilityPercentage,
    description,
    advice,
    isMenstruation,
    isOvulation,
    isFertileWindow,
    isToday: targetDateStr === todayStr,
  };
}

/**
 * Calculates full cycle details from the latest period log, including next period date,
 * ovulation date, fertile window, late period calculation, and future cycle predictions.
 */
export function calculateCycleResult(
  latestStartDate: string,
  cycleLength: number = 28,
  periodLength: number = 5,
  lutealPhase: number = 14,
  todayStr: string = formatDateString(new Date())
): CycleCalculationResult {
  const daysDiff = diffDays(todayStr, latestStartDate);

  // Next period date = latestStartDate + cycleLength
  const nextPeriodDate = addDays(latestStartDate, cycleLength);

  // Ovulation date = nextPeriodDate - lutealPhase
  const ovulationDate = addDays(latestStartDate, cycleLength - lutealPhase);

  // Fertile window: [ovulation - 5, ovulation + 1]
  const fertileWindowStart = addDays(ovulationDate, -5);
  const fertileWindowEnd = addDays(ovulationDate, 1);

  // Current day of cycle
  const currentCycleDay = daysDiff >= 0 ? daysDiff + 1 : 1;
  const isPeriodLate = daysDiff > cycleLength;
  const lateDays = isPeriodLate ? daysDiff - cycleLength : 0;

  const daysUntilNextPeriod = diffDays(nextPeriodDate, todayStr);
  const daysUntilOvulation = diffDays(ovulationDate, todayStr);

  const todayInfo = calculateDayCycleInfo(
    todayStr,
    latestStartDate,
    cycleLength,
    periodLength,
    lutealPhase
  );

  // Predict the next 3 cycles
  const predictedCycles = [];
  let prevStart = latestStartDate;
  for (let i = 1; i <= 3; i++) {
    const start = addDays(prevStart, cycleLength);
    const end = addDays(start, cycleLength - 1);
    const ovDate = addDays(start, cycleLength - lutealPhase);
    const fStart = addDays(ovDate, -5);
    const fEnd = addDays(ovDate, 1);

    predictedCycles.push({
      cycleNumber: i,
      startDate: start,
      endDate: end,
      ovulationDate: ovDate,
      fertileWindowStart: fStart,
      fertileWindowEnd: fEnd,
    });
    prevStart = start;
  }

  return {
    currentCycleDay,
    totalCycleLength: cycleLength,
    periodLength,
    cycleStartDate: latestStartDate,
    nextPeriodDate,
    ovulationDate,
    fertileWindowStart,
    fertileWindowEnd,
    todayInfo,
    daysUntilNextPeriod,
    daysUntilOvulation,
    isPeriodLate,
    lateDays,
    predictedCycles,
  };
}

/**
 * Computes average cycle length from historic logs
 */
export function calculateAverageCycleLength(
  logs: MenstrualCycleLog[],
  fallbackLength: number = 28
): number {
  if (!logs || logs.length < 2) return fallbackLength;

  // Sort logs ascending by startDate
  const sorted = [...logs].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const diffs: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const diff = diffDays(sorted[i].startDate, sorted[i - 1].startDate);
    // Only accept realistic cycle lengths (18 to 60 days) to avoid skewed averages
    if (diff >= 18 && diff <= 60) {
      diffs.push(diff);
    }
  }

  if (diffs.length === 0) return fallbackLength;
  const avg = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
  return avg;
}
