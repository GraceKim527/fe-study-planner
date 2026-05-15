import type { StudyBlock } from "@/types";
import { initialBlocks } from "./data";

// weekStart(YYYY-MM-DD) → 블록 배열. 메모리 보관, 새로고침 시 초기화.
const store = new Map<string, StudyBlock[]>();

// 초기 시드는 "현재 주"가 아니라 빈 키로 두지 않고, 첫 GET 시점에 weekStart로 시드한다.
// 이러면 어떤 주를 처음 열어도 데모 블록이 보임 — 채점관 첫 인상 관점.
let seeded = false;

export function getBlocks(weekStart: string): StudyBlock[] {
  if (!seeded) {
    store.set(weekStart, [...initialBlocks]);
    seeded = true;
  }
  return store.get(weekStart) ?? [];
}

export function setBlocks(weekStart: string, blocks: StudyBlock[]): void {
  store.set(weekStart, blocks);
  seeded = true;
}
