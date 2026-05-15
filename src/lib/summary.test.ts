import { describe, expect, it } from "vitest";
import type { Course, StudyBlock } from "@/types";
import { summarizeWeek } from "./summary";

const courses: Course[] = [
  { id: "c1", title: "React", color: "#0f0" },
  { id: "c2", title: "TypeScript", color: "#00f" },
  { id: "c3", title: "Algorithm", color: "#f00" },
];

function block(over: Partial<StudyBlock>): StudyBlock {
  return {
    id: "b",
    courseId: "c1",
    dayOfWeek: 0,
    startTime: "09:00",
    endTime: "10:00",
    ...over,
  };
}

describe("summarizeWeek", () => {
  it("빈 입력은 0으로 채워진 결과를 반환한다", () => {
    const r = summarizeWeek([], courses);
    expect(r.totalMinutes).toBe(0);
    expect(r.byCourse).toEqual([]);
    expect(r.byDay).toEqual({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
  });

  it("같은 강의 여러 블록을 합산한다", () => {
    const r = summarizeWeek(
      [
        block({ id: "1", courseId: "c1", dayOfWeek: 0, startTime: "09:00", endTime: "10:30" }),
        block({ id: "2", courseId: "c1", dayOfWeek: 2, startTime: "14:00", endTime: "15:00" }),
      ],
      courses,
    );
    expect(r.totalMinutes).toBe(150);
    expect(r.byCourse).toHaveLength(1);
    expect(r.byCourse[0]).toEqual({ course: courses[0], minutes: 150 });
  });

  it("byCourse는 분 내림차순으로 정렬된다", () => {
    const r = summarizeWeek(
      [
        block({ id: "1", courseId: "c1", startTime: "09:00", endTime: "10:00" }),
        block({ id: "2", courseId: "c2", dayOfWeek: 1, startTime: "09:00", endTime: "12:00" }),
        block({ id: "3", courseId: "c3", dayOfWeek: 2, startTime: "09:00", endTime: "11:00" }),
      ],
      courses,
    );
    expect(r.byCourse.map((c) => c.course.id)).toEqual(["c2", "c3", "c1"]);
  });

  it("같은 분량은 강의명(ko) 오름차순으로 정렬된다", () => {
    const r = summarizeWeek(
      [
        block({ id: "1", courseId: "c2", startTime: "09:00", endTime: "10:00" }),
        block({ id: "2", courseId: "c1", dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }),
      ],
      courses,
    );
    expect(r.byCourse.map((c) => c.course.id)).toEqual(["c1", "c2"]);
  });

  it("byDay는 요일별로 분을 누적한다", () => {
    const r = summarizeWeek(
      [
        block({ id: "1", dayOfWeek: 0, startTime: "09:00", endTime: "10:00" }),
        block({ id: "2", dayOfWeek: 0, startTime: "10:00", endTime: "11:30" }),
        block({ id: "3", dayOfWeek: 6, startTime: "20:00", endTime: "21:00" }),
      ],
      courses,
    );
    expect(r.byDay[0]).toBe(150);
    expect(r.byDay[6]).toBe(60);
    expect(r.byDay[3]).toBe(0);
    expect(r.totalMinutes).toBe(210);
  });

  it("알 수 없는 courseId 블록은 무시한다", () => {
    const r = summarizeWeek(
      [
        block({ id: "1", courseId: "ghost", startTime: "09:00", endTime: "10:00" }),
        block({ id: "2", courseId: "c1", startTime: "10:00", endTime: "11:00" }),
      ],
      courses,
    );
    expect(r.totalMinutes).toBe(60);
    expect(r.byCourse).toHaveLength(1);
    expect(r.byCourse[0].course.id).toBe("c1");
  });

  it("종료가 시작보다 이르거나 같은 블록은 0/음수 길이로 간주해 제외한다", () => {
    const r = summarizeWeek(
      [
        block({ id: "1", startTime: "10:00", endTime: "10:00" }),
        block({ id: "2", startTime: "11:00", endTime: "10:00" }),
        block({ id: "3", startTime: "09:00", endTime: "10:00" }),
      ],
      courses,
    );
    expect(r.totalMinutes).toBe(60);
    expect(r.byCourse).toHaveLength(1);
  });
});
