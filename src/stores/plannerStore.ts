import { create } from "zustand";
import type {
  DayOfWeek,
  EditableStudyBlock,
  SavePlannerRequestBlock,
  StudyBlock,
  TimeString,
} from "@/types";

// "편집 중 상태"만 담는다. 서버 상태는 TanStack Query.
// dirty 판정은 hydrate 시점의 original 스냅샷과 현재 blocks 비교.
//
// 신규 블록: 클라에서 임시 id(crypto.randomUUID) + isNew=true.
// 저장 직전 isNew=true 블록은 id를 빼고 SavePlannerRequest로 변환한다.

interface PlannerState {
  blocks: EditableStudyBlock[];
  original: StudyBlock[];
  weekStart: string;

  hydrate(weekStart: string, blocks: StudyBlock[]): void;
  addBlock(input: {
    courseId: string;
    dayOfWeek: DayOfWeek;
    startTime: TimeString;
    endTime: TimeString;
    memo?: string;
  }): string;
  updateBlock(id: string, patch: Partial<Omit<EditableStudyBlock, "id" | "isNew">>): void;
  removeBlock(id: string): void;
  reset(): void;
}

function snapshot(blocks: StudyBlock[]): StudyBlock[] {
  return blocks.map((b) => ({ ...b }));
}

export const usePlannerStore = create<PlannerState>((set) => ({
  blocks: [],
  original: [],
  weekStart: "",

  hydrate: (weekStart, blocks) =>
    set({
      weekStart,
      blocks: snapshot(blocks),
      original: snapshot(blocks),
    }),

  addBlock: (input) => {
    const id = crypto.randomUUID();
    set((s) => ({
      blocks: [...s.blocks, { id, isNew: true, ...input }],
    }));
    return id;
  },

  updateBlock: (id, patch) =>
    set((s) => ({
      blocks: s.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    })),

  removeBlock: (id) =>
    set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) })),

  reset: () => set((s) => ({ blocks: snapshot(s.original) })),
}));

// dirty 판정: original과 현재 blocks를 비교.
// 같은 길이 + 모든 항목이 id-by-id로 동일 필드값이어야 not dirty.
// 신규 블록(isNew)이 하나라도 있으면 dirty (original엔 없음).
export function isDirty(state: PlannerState): boolean {
  return countChanges(state) > 0;
}

// 추가/수정/삭제된 블록의 총 개수. SaveBar의 "변경사항 N개" 표시에 사용.
export function countChanges(state: PlannerState): number {
  const { blocks, original } = state;
  const orig = new Map(original.map((b) => [b.id, b]));
  const seen = new Set<string>();
  let changes = 0;

  for (const b of blocks) {
    if (b.isNew) {
      changes += 1;
      continue;
    }
    seen.add(b.id);
    const o = orig.get(b.id);
    if (!o) {
      changes += 1;
      continue;
    }
    if (
      o.courseId !== b.courseId ||
      o.dayOfWeek !== b.dayOfWeek ||
      o.startTime !== b.startTime ||
      o.endTime !== b.endTime ||
      (o.memo ?? "") !== (b.memo ?? "")
    ) {
      changes += 1;
    }
  }
  // 삭제된 블록(original에는 있는데 현재 blocks엔 없음)
  for (const o of original) {
    if (!seen.has(o.id)) changes += 1;
  }
  return changes;
}

// 저장 페이로드 변환 — isNew 블록은 id 제거.
export function toSaveRequestBlocks(
  blocks: EditableStudyBlock[],
): SavePlannerRequestBlock[] {
  return blocks.map((b) => {
    const base: SavePlannerRequestBlock = {
      courseId: b.courseId,
      dayOfWeek: b.dayOfWeek,
      startTime: b.startTime,
      endTime: b.endTime,
      memo: b.memo,
    };
    return b.isNew ? base : { ...base, id: b.id };
  });
}
