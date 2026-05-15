import type { StudyBlock } from "@/types";
import { timeToMinutes } from "./time";

// 반열림 구간 [start, end). 인접(09:00-10:00 + 10:00-11:00)은 충돌 아님.
export function hasConflict(a: StudyBlock, b: StudyBlock): boolean {
  if (a.id === b.id) return false;
  if (a.dayOfWeek !== b.dayOfWeek) return false;

  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);

  return aStart < bEnd && bStart < aEnd;
}

// 전체에서 자기 자신과 충돌하는 블록 id 집합 반환. UI 시각화용.
export function findConflictingIds(blocks: StudyBlock[]): Set<string> {
  const conflicting = new Set<string>();
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      if (hasConflict(blocks[i], blocks[j])) {
        conflicting.add(blocks[i].id);
        conflicting.add(blocks[j].id);
      }
    }
  }
  return conflicting;
}

// 저장 가능 여부. 충돌이 하나라도 있으면 false.
export function hasAnyConflict(blocks: StudyBlock[]): boolean {
  return findConflictingIds(blocks).size > 0;
}
