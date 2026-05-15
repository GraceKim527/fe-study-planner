import type { DayOfWeek, TimeString } from "@/types";

const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function timeToMinutes(time: TimeString): number {
  const match = TIME_PATTERN.exec(time);
  if (!match) return NaN;
  const [, hh, mm] = match;
  return Number(hh) * MINUTES_PER_HOUR + Number(mm);
}

export function minutesToTime(minutes: number): TimeString {
  if (!Number.isFinite(minutes) || minutes < 0 || minutes >= HOURS_PER_DAY * MINUTES_PER_HOUR) {
    return "";
  }
  const hh = Math.floor(minutes / MINUTES_PER_HOUR);
  const mm = minutes % MINUTES_PER_HOUR;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// startHour 포함, endHour 포함. step은 분 단위 (30 또는 60).
export function generateTimeSlots(
  startHour: number,
  endHour: number,
  stepMinutes: number,
): TimeString[] {
  const slots: TimeString[] = [];
  const start = startHour * MINUTES_PER_HOUR;
  const end = endHour * MINUTES_PER_HOUR;
  for (let m = start; m <= end; m += stepMinutes) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

// Date.getDay()는 0(일)~6(토). 본 도메인은 0(월)~6(일)이라 변환 필요.
export function toDayOfWeek(date: Date): DayOfWeek {
  const jsDay = date.getDay();
  return ((jsDay + 6) % 7) as DayOfWeek;
}

// 기준 날짜가 속한 주의 월요일 00:00 (로컬 타임존).
export function getWeekStart(date: Date): Date {
  const day = toDayOfWeek(date);
  const monday = new Date(date);
  monday.setDate(date.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// "YYYY-MM-DD" 로컬 기준. ISO UTC 변환은 timezone 이슈가 있어 의도적으로 로컬 포맷.
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatTimeRange(start: TimeString, end: TimeString): string {
  return `${start} - ${end}`;
}

// "5월 11일(월) – 5월 17일(일)" 형태. 헤더용.
const WEEK_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;
export function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    `${d.getMonth() + 1}월 ${d.getDate()}일(${WEEK_LABELS[toDayOfWeek(d)]})`;
  return `${fmt(weekStart)} – ${fmt(end)}`;
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0분";
  const h = Math.floor(minutes / MINUTES_PER_HOUR);
  const m = minutes % MINUTES_PER_HOUR;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}
