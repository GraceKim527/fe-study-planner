import type { StudyBlock } from "@/types";
import { formatDateKey, getWeekStart } from "@/lib/time";
import { initialBlocks } from "./data";

// weekStart(YYYY-MM-DD) → 블록 배열. 메모리 보관, 새로고침 시 초기화.
const store = new Map<string, StudyBlock[]>();

// 데모 시드는 "이번 주"에만. 지난주/다음주는 빈 상태로 시작해
// 주간 이동이 실제로 의미 있게 보이도록 한다.
const thisWeekKey = formatDateKey(getWeekStart(new Date()));
let seeded = false;

function ensureSeed() {
  if (seeded) return;
  store.set(thisWeekKey, [...initialBlocks]);
  seeded = true;
}

export function getBlocks(weekStart: string): StudyBlock[] {
  ensureSeed();
  return store.get(weekStart) ?? [];
}

export function setBlocks(weekStart: string, blocks: StudyBlock[]): void {
  ensureSeed();
  store.set(weekStart, blocks);
}
