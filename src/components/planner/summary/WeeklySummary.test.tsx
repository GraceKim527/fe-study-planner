import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { WeeklySummary } from "./WeeklySummary";
import type { Course, StudyBlock } from "@/types";

afterEach(cleanup);

const COURSES: Course[] = [
  { id: "c1", title: "React 심화", color: "#22C55E" },
  { id: "c2", title: "TypeScript", color: "#3B82F6" },
  { id: "c3", title: "자료구조", color: "#F59E0B" },
];

describe("WeeklySummary", () => {
  it("블록이 없으면 빈 상태 메시지를 보여주고 차트 영역은 그리지 않는다", () => {
    render(<WeeklySummary blocks={[]} courses={COURSES} />);
    expect(screen.getByText(/아직 이번 주 학습 계획이 없어요/)).toBeInTheDocument();
    expect(screen.queryByText("강의별")).not.toBeInTheDocument();
    expect(screen.getByText("0분")).toBeInTheDocument();
  });

  it("총합·블록 수·강의 수를 정확히 표시한다", () => {
    const blocks: StudyBlock[] = [
      { id: "b1", courseId: "c1", dayOfWeek: 0, startTime: "09:00", endTime: "11:00" },
      { id: "b2", courseId: "c2", dayOfWeek: 1, startTime: "10:00", endTime: "11:30" },
      { id: "b3", courseId: "c1", dayOfWeek: 2, startTime: "13:00", endTime: "14:00" },
    ];
    render(<WeeklySummary blocks={blocks} courses={COURSES} />);

    // 2h + 1h30m + 1h = 4h 30m
    expect(screen.getByText("4시간 30분")).toBeInTheDocument();
    expect(screen.getByText(/블록 3개/)).toBeInTheDocument();
    expect(screen.getByText(/강의 2개/)).toBeInTheDocument();
  });

  it("강의별 행은 분 내림차순으로 정렬되고 각 행에 시간·% 가 표시된다", () => {
    const blocks: StudyBlock[] = [
      { id: "b1", courseId: "c1", dayOfWeek: 0, startTime: "09:00", endTime: "12:00" }, // 3h
      { id: "b2", courseId: "c2", dayOfWeek: 1, startTime: "10:00", endTime: "11:00" }, // 1h
    ];
    render(<WeeklySummary blocks={blocks} courses={COURSES} />);

    const list = screen.getByLabelText("강의별 학습 시간");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("React 심화")).toBeInTheDocument();
    expect(within(items[0]).getByText("3시간")).toBeInTheDocument();
    expect(within(items[0]).getByText("75%")).toBeInTheDocument();
    expect(within(items[1]).getByText("TypeScript")).toBeInTheDocument();
    expect(within(items[1]).getByText("1시간")).toBeInTheDocument();
    expect(within(items[1]).getByText("25%")).toBeInTheDocument();
  });

  it("요일별 차트는 7개 항목을 항상 그리고 0인 요일은 '—' 로 표시한다", () => {
    const blocks: StudyBlock[] = [
      { id: "b1", courseId: "c1", dayOfWeek: 0, startTime: "09:00", endTime: "10:00" },
      { id: "b2", courseId: "c1", dayOfWeek: 4, startTime: "13:00", endTime: "14:00" },
    ];
    render(<WeeklySummary blocks={blocks} courses={COURSES} />);

    const days = screen.getByLabelText("요일별 학습 시간");
    const items = within(days).getAllByRole("listitem");
    expect(items).toHaveLength(7);
    // 5개 요일은 0이라 "—" 가 5번 등장
    expect(within(days).getAllByText("—")).toHaveLength(5);
  });

  it("알 수 없는 courseId의 블록은 집계에서 제외한다", () => {
    const blocks: StudyBlock[] = [
      { id: "b1", courseId: "c1", dayOfWeek: 0, startTime: "09:00", endTime: "10:00" },
      { id: "b2", courseId: "ghost", dayOfWeek: 1, startTime: "10:00", endTime: "12:00" },
    ];
    render(<WeeklySummary blocks={blocks} courses={COURSES} />);
    // 총합은 ghost를 뺀 1시간
    const courseList = screen.getByLabelText("강의별 학습 시간");
    const items = within(courseList).getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(within(items[0]).getByText("React 심화")).toBeInTheDocument();
    expect(screen.getByText(/블록 1개/)).toBeInTheDocument();
  });
});
