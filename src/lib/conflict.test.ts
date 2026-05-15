import { describe, it, expect } from "vitest";
import type { StudyBlock, DayOfWeek } from "@/types";
import { hasConflict, findConflictingIds, hasAnyConflict } from "./conflict";

const block = (
  id: string,
  day: DayOfWeek,
  start: string,
  end: string,
): StudyBlock => ({
  id,
  courseId: "c1",
  dayOfWeek: day,
  startTime: start,
  endTime: end,
});

describe("hasConflict", () => {
  it("같은 id면 충돌 아님 (자기 자신)", () => {
    const a = block("1", 0, "09:00", "10:00");
    expect(hasConflict(a, a)).toBe(false);
  });

  it("다른 요일이면 충돌 아님", () => {
    const a = block("1", 0, "09:00", "10:00");
    const b = block("2", 1, "09:00", "10:00");
    expect(hasConflict(a, b)).toBe(false);
  });

  it("완전히 같은 구간은 충돌", () => {
    const a = block("1", 0, "09:00", "10:00");
    const b = block("2", 0, "09:00", "10:00");
    expect(hasConflict(a, b)).toBe(true);
  });

  it("부분 겹침은 충돌", () => {
    const a = block("1", 0, "09:00", "10:00");
    const b = block("2", 0, "09:30", "10:30");
    expect(hasConflict(a, b)).toBe(true);
  });

  it("a가 b를 완전히 포함하면 충돌", () => {
    const a = block("1", 0, "09:00", "12:00");
    const b = block("2", 0, "10:00", "11:00");
    expect(hasConflict(a, b)).toBe(true);
  });

  it("인접(끝과 시작이 같음)은 충돌 아님 — 결정 003", () => {
    const a = block("1", 0, "09:00", "10:00");
    const b = block("2", 0, "10:00", "11:00");
    expect(hasConflict(a, b)).toBe(false);
  });

  it("완전히 떨어져 있으면 충돌 아님", () => {
    const a = block("1", 0, "09:00", "10:00");
    const b = block("2", 0, "11:00", "12:00");
    expect(hasConflict(a, b)).toBe(false);
  });
});

describe("findConflictingIds", () => {
  it("빈 배열은 빈 집합", () => {
    expect(findConflictingIds([]).size).toBe(0);
  });

  it("충돌 없으면 빈 집합", () => {
    const blocks = [
      block("1", 0, "09:00", "10:00"),
      block("2", 0, "10:00", "11:00"),
      block("3", 1, "09:00", "10:00"),
    ];
    expect(findConflictingIds(blocks).size).toBe(0);
  });

  it("충돌하는 두 블록 id 모두 포함", () => {
    const blocks = [
      block("1", 0, "09:00", "10:00"),
      block("2", 0, "09:30", "10:30"),
    ];
    const ids = findConflictingIds(blocks);
    expect(ids.has("1")).toBe(true);
    expect(ids.has("2")).toBe(true);
    expect(ids.size).toBe(2);
  });

  it("3개가 서로 겹치면 모두 포함", () => {
    const blocks = [
      block("1", 0, "09:00", "11:00"),
      block("2", 0, "10:00", "12:00"),
      block("3", 0, "10:30", "11:30"),
    ];
    expect(findConflictingIds(blocks).size).toBe(3);
  });
});

describe("hasAnyConflict", () => {
  it("충돌 없으면 false", () => {
    const blocks = [block("1", 0, "09:00", "10:00")];
    expect(hasAnyConflict(blocks)).toBe(false);
  });

  it("충돌 하나라도 있으면 true", () => {
    const blocks = [
      block("1", 0, "09:00", "10:00"),
      block("2", 0, "09:30", "10:30"),
    ];
    expect(hasAnyConflict(blocks)).toBe(true);
  });
});
