import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeekNav } from "./WeekNav";
import { usePlannerStore } from "@/stores/plannerStore";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const weekStart = "2026-05-11";
const weekStartDate = new Date(2026, 4, 11);

beforeEach(() => {
  push.mockClear();
  usePlannerStore.setState({ weekStart, blocks: [], original: [] });
});

afterEach(cleanup);

describe("WeekNav", () => {
  it("이전/다음 주 버튼은 ±7일 weekStart로 push", async () => {
    const user = userEvent.setup();
    render(<WeekNav weekStart={weekStart} weekStartDate={weekStartDate} isThisWeek />);

    await user.click(screen.getByRole("button", { name: "이전 주" }));
    expect(push).toHaveBeenCalledWith("/?weekStart=2026-05-04");

    await user.click(screen.getByRole("button", { name: "다음 주" }));
    expect(push).toHaveBeenCalledWith("/?weekStart=2026-05-18");
  });

  it("isThisWeek=true면 '오늘' 버튼이 비활성화된다", () => {
    render(<WeekNav weekStart={weekStart} weekStartDate={weekStartDate} isThisWeek />);
    expect(screen.getByRole("button", { name: "오늘로" })).toBeDisabled();
  });

  it("isThisWeek=false면 '오늘' 버튼이 활성화된다", () => {
    render(<WeekNav weekStart={weekStart} weekStartDate={weekStartDate} isThisWeek={false} />);
    expect(screen.getByRole("button", { name: "오늘로" })).toBeEnabled();
  });

  it("dirty 상태에서 이동 시 confirm을 띄우고 거절 시 push 안 됨", async () => {
    usePlannerStore.setState({
      weekStart,
      original: [],
      blocks: [
        {
          id: "tmp",
          isNew: true,
          courseId: "c1",
          dayOfWeek: 0,
          startTime: "09:00",
          endTime: "10:00",
        },
      ],
    });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<WeekNav weekStart={weekStart} weekStartDate={weekStartDate} isThisWeek />);

    await user.click(screen.getByRole("button", { name: "다음 주" }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(push).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it("dirty 상태에서 confirm 수락 시 push 진행", async () => {
    usePlannerStore.setState({
      weekStart,
      original: [],
      blocks: [
        {
          id: "tmp",
          isNew: true,
          courseId: "c1",
          dayOfWeek: 0,
          startTime: "09:00",
          endTime: "10:00",
        },
      ],
    });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<WeekNav weekStart={weekStart} weekStartDate={weekStartDate} isThisWeek />);

    await user.click(screen.getByRole("button", { name: "다음 주" }));
    expect(push).toHaveBeenCalledWith("/?weekStart=2026-05-18");
    confirm.mockRestore();
  });

  it("주차 텍스트가 표시된다", () => {
    render(<WeekNav weekStart={weekStart} weekStartDate={weekStartDate} isThisWeek />);
    expect(screen.getByText(/5월 11일/)).toBeInTheDocument();
  });
});
