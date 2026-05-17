import type { DayOfWeek, TimeString } from "@/types";
import { DAY_LABELS } from "./day";

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

// startHour, endHour 모두 포함.
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

// Date.getDay()는 0(일)~6(토). 도메인은 0(월)~6(일).
export function toDayOfWeek(date: Date): DayOfWeek {
  const jsDay = date.getDay();
  return ((jsDay + 6) % 7) as DayOfWeek;
}

export function getWeekStart(date: Date): Date {
  const day = toDayOfWeek(date);
  const monday = new Date(date);
  monday.setDate(date.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// new Date("2026-05-11")은 UTC 자정 → 타임존에 따라 하루 밀림. 명시적으로 로컬 생성.
export function parseDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (
    date.getFullYear() !== Number(y) ||
    date.getMonth() !== Number(m) - 1 ||
    date.getDate() !== Number(d)
  ) {
    return null;
  }
  return date;
}

export function addWeeks(weekStart: Date, delta: number): Date {
  const next = new Date(weekStart);
  next.setDate(weekStart.getDate() + delta * 7);
  return next;
}

// toISOString() 쓰면 UTC라 타임존에 따라 하루 밀림.
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatTimeRange(start: TimeString, end: TimeString): string {
  return `${start} - ${end}`;
}

export function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    `${d.getMonth() + 1}월 ${d.getDate()}일(${DAY_LABELS[toDayOfWeek(d)]})`;
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

interface SnapOptions {
  slotMinutes: number;
  slotHeightPx: number;
  dayStartMinutes: number;
  // 컨테이너 상단 padding(slot/2 등). 이 영역 안이면 null 반환.
  topPaddingPx?: number;
}

// 그리드 컨테이너 내 offsetY를 slotMinutes 단위로 스냅한 시작 분으로 변환.
// topPaddingPx 위 영역(=음수 y)이면 null.
export function snapYToMinute(offsetY: number, opts: SnapOptions): number | null {
  const adjusted = offsetY - (opts.topPaddingPx ?? 0);
  if (adjusted < 0) return null;
  const pxPerMinute = opts.slotHeightPx / opts.slotMinutes;
  const rawMin = adjusted / pxPerMinute;
  const snapped = Math.floor(rawMin / opts.slotMinutes) * opts.slotMinutes;
  return opts.dayStartMinutes + snapped;
}
