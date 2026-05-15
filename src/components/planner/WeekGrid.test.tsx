import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeekGrid } from "./WeekGrid";
import type { Course, StudyBlock } from "@/types";

afterEach(cleanup);

const COURSES: Course[] = [{ id: "c1", title: "수학", color: "#22C55E" }];
const WEEK_START = new Date(2026, 4, 11);

const SLOT_HEIGHT = 40;
const PX_PER_MIN = SLOT_HEIGHT / 30;
const TOP_PADDING = SLOT_HEIGHT / 2;

// startHour=8 기준 → 화요일 컬럼의 클릭 좌표를 시각으로 환산.
function dayColumnAt(index: number) {
  // dayColumn은 [시간 컬럼, 월~일] 순서라 index 0이 월요일.
  const groups = screen.getAllByRole("group");
  return groups[index];
}

describe("WeekGrid 슬롯 클릭", () => {
  it("dayColumn 클릭 시 y → 30분 단위 시작 시각으로 onSlotClick 호출", async () => {
    const onSlotClick = vi.fn();
    render(
      <WeekGrid
        blocks={[]}
        courses={COURSES}
        weekStart={WEEK_START}
        onSlotClick={onSlotClick}
      />,
    );

    const tueColumn = dayColumnAt(1);
    // jsdom은 layout이 0이라 getBoundingClientRect를 mock해야 한다.
    vi.spyOn(tueColumn, "getBoundingClientRect").mockReturnValue({
      top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, width: 100, height: 600, toJSON: () => ({}),
    } as DOMRect);

    // y=TOP_PADDING + 60min*PX_PER_MIN = 20 + 120 = 140 → 9시 정각 클릭
    await userEvent.pointer({ target: tueColumn, coords: { clientY: TOP_PADDING + 60 * PX_PER_MIN, clientX: 50 }, keys: "[MouseLeft]" });

    expect(onSlotClick).toHaveBeenCalledWith(1, "09:00");
  });

  it("30분 단위 미만은 내림 스냅 (10분 → 정각)", async () => {
    const onSlotClick = vi.fn();
    render(<WeekGrid blocks={[]} courses={COURSES} weekStart={WEEK_START} onSlotClick={onSlotClick} />);
    const monColumn = dayColumnAt(0);
    vi.spyOn(monColumn, "getBoundingClientRect").mockReturnValue({
      top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, width: 100, height: 600, toJSON: () => ({}),
    } as DOMRect);

    // 10분 위치 → 8시 정각으로 스냅
    await userEvent.pointer({ target: monColumn, coords: { clientY: TOP_PADDING + 10 * PX_PER_MIN, clientX: 50 }, keys: "[MouseLeft]" });
    expect(onSlotClick).toHaveBeenCalledWith(0, "08:00");
  });

  it("그리드 종료 시각 직전 슬롯 클릭은 무시 (endHour=22일 때 21:30 이후 시작 불가)", async () => {
    const onSlotClick = vi.fn();
    render(
      <WeekGrid blocks={[]} courses={COURSES} weekStart={WEEK_START} onSlotClick={onSlotClick} />,
    );
    const wedColumn = dayColumnAt(2);
    vi.spyOn(wedColumn, "getBoundingClientRect").mockReturnValue({
      top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, width: 100, height: 1200, toJSON: () => ({}),
    } as DOMRect);

    // 22:00 시작 위치 클릭 → endHour 위라 무시
    await userEvent.pointer({ target: wedColumn, coords: { clientY: TOP_PADDING + 14 * 60 * PX_PER_MIN, clientX: 50 }, keys: "[MouseLeft]" });
    expect(onSlotClick).not.toHaveBeenCalled();
  });

  it("카드 클릭은 onBlockClick으로 가고 onSlotClick은 호출되지 않는다", async () => {
    const onSlotClick = vi.fn();
    const onBlockClick = vi.fn();
    const block: StudyBlock = {
      id: "b1", courseId: "c1", dayOfWeek: 0, startTime: "09:00", endTime: "10:00",
    };
    render(
      <WeekGrid
        blocks={[block]}
        courses={COURSES}
        weekStart={WEEK_START}
        onSlotClick={onSlotClick}
        onBlockClick={onBlockClick}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /수학/ }));
    expect(onBlockClick).toHaveBeenCalledWith(block);
    expect(onSlotClick).not.toHaveBeenCalled();
  });
});
