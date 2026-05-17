import type { DayOfWeek } from "@/types";

// 0(월)~6(일). Date.getDay()와 다름 — toDayOfWeek() 참고.
export const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

export function dayLabel(day: DayOfWeek): string {
  return DAY_LABELS[day];
}
