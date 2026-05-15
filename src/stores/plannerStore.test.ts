import { beforeEach, describe, expect, it } from "vitest";
import type { StudyBlock } from "@/types";
import { isDirty, toSaveRequestBlocks, usePlannerStore } from "./plannerStore";

const sample: StudyBlock[] = [
  { id: "b-1", courseId: "c-react", dayOfWeek: 0, startTime: "09:00", endTime: "10:00" },
  { id: "b-2", courseId: "c-ts", dayOfWeek: 1, startTime: "11:00", endTime: "12:00", memo: "복습" },
];

beforeEach(() => {
  usePlannerStore.setState({ blocks: [], original: [], weekStart: "" });
});

describe("plannerStore", () => {
  it("hydrate 후 dirty=false", () => {
    usePlannerStore.getState().hydrate("2026-05-11", sample);
    expect(isDirty(usePlannerStore.getState())).toBe(false);
  });

  it("addBlock 시 dirty=true, isNew=true, 임시 id", () => {
    usePlannerStore.getState().hydrate("2026-05-11", sample);
    const id = usePlannerStore.getState().addBlock({
      courseId: "c-css",
      dayOfWeek: 2,
      startTime: "14:00",
      endTime: "15:00",
    });
    const state = usePlannerStore.getState();
    expect(id).toBeTruthy();
    expect(state.blocks.find((b) => b.id === id)?.isNew).toBe(true);
    expect(isDirty(state)).toBe(true);
  });

  it("updateBlock으로 시간 바꾸면 dirty=true", () => {
    usePlannerStore.getState().hydrate("2026-05-11", sample);
    usePlannerStore.getState().updateBlock("b-1", { endTime: "10:30" });
    expect(isDirty(usePlannerStore.getState())).toBe(true);
  });

  it("동일 값으로 updateBlock하면 dirty=false 유지", () => {
    usePlannerStore.getState().hydrate("2026-05-11", sample);
    usePlannerStore.getState().updateBlock("b-1", { endTime: "10:00" });
    expect(isDirty(usePlannerStore.getState())).toBe(false);
  });

  it("removeBlock 시 dirty=true", () => {
    usePlannerStore.getState().hydrate("2026-05-11", sample);
    usePlannerStore.getState().removeBlock("b-1");
    expect(isDirty(usePlannerStore.getState())).toBe(true);
  });

  it("reset으로 original 복원", () => {
    usePlannerStore.getState().hydrate("2026-05-11", sample);
    usePlannerStore.getState().addBlock({
      courseId: "c-css",
      dayOfWeek: 2,
      startTime: "14:00",
      endTime: "15:00",
    });
    usePlannerStore.getState().updateBlock("b-1", { endTime: "11:00" });
    usePlannerStore.getState().reset();
    const state = usePlannerStore.getState();
    expect(state.blocks).toEqual(sample);
    expect(isDirty(state)).toBe(false);
  });

  it("memo 변화도 dirty 판정에 포함", () => {
    usePlannerStore.getState().hydrate("2026-05-11", sample);
    usePlannerStore.getState().updateBlock("b-2", { memo: "다른 메모" });
    expect(isDirty(usePlannerStore.getState())).toBe(true);
  });

  it("memo undefined ↔ '' 차이는 dirty 아님", () => {
    usePlannerStore.getState().hydrate("2026-05-11", sample);
    usePlannerStore.getState().updateBlock("b-1", { memo: "" });
    expect(isDirty(usePlannerStore.getState())).toBe(false);
  });

  it("toSaveRequestBlocks: isNew는 id 제거, 기존은 id 유지", () => {
    usePlannerStore.getState().hydrate("2026-05-11", sample);
    usePlannerStore.getState().addBlock({
      courseId: "c-css",
      dayOfWeek: 2,
      startTime: "14:00",
      endTime: "15:00",
    });
    const payload = toSaveRequestBlocks(usePlannerStore.getState().blocks);
    expect(payload).toHaveLength(3);
    expect(payload[0].id).toBe("b-1");
    expect(payload[1].id).toBe("b-2");
    expect(payload[2].id).toBeUndefined();
  });

  it("rehydrate(저장 후 응답 반영)하면 dirty=false로 돌아옴", () => {
    usePlannerStore.getState().hydrate("2026-05-11", sample);
    const id = usePlannerStore.getState().addBlock({
      courseId: "c-css",
      dayOfWeek: 2,
      startTime: "14:00",
      endTime: "15:00",
    });
    expect(isDirty(usePlannerStore.getState())).toBe(true);

    // 서버 응답: 신규 블록에 확정 id가 부여됨.
    const serverBlocks: StudyBlock[] = [
      ...sample,
      { id: "srv-3", courseId: "c-css", dayOfWeek: 2, startTime: "14:00", endTime: "15:00" },
    ];
    usePlannerStore.getState().hydrate("2026-05-11", serverBlocks);
    const state = usePlannerStore.getState();
    expect(isDirty(state)).toBe(false);
    expect(state.blocks.find((b) => b.id === id)).toBeUndefined();
  });
});
