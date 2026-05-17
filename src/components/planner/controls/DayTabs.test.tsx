import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DayTabs } from "./DayTabs";

afterEach(cleanup);

const dayDates = [11, 12, 13, 14, 15, 16, 17];

describe("DayTabs", () => {
  it("7개 요일 탭이 렌더된다", () => {
    render(<DayTabs selected={0} dayDates={dayDates} onChange={() => {}} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(7);
  });

  it("selected 탭은 aria-selected=true, 나머지는 false", () => {
    render(<DayTabs selected={2} dayDates={dayDates} onChange={() => {}} />);
    const tabs = screen.getAllByRole("tab");
    tabs.forEach((tab, i) => {
      expect(tab).toHaveAttribute("aria-selected", String(i === 2));
    });
  });

  it("탭 클릭 시 onChange가 해당 요일과 함께 호출된다", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DayTabs selected={0} dayDates={dayDates} onChange={onChange} />);
    await user.click(screen.getAllByRole("tab")[3]);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("요일 라벨과 날짜가 함께 표시된다", () => {
    render(<DayTabs selected={0} dayDates={dayDates} onChange={() => {}} />);
    expect(screen.getByText("월")).toBeInTheDocument();
    expect(screen.getByText("13")).toBeInTheDocument();
  });

  it("todayDayOfWeek가 selected와 다르면 today 클래스가 별도로 붙는다", () => {
    render(<DayTabs selected={0} todayDayOfWeek={3} dayDates={dayDates} onChange={() => {}} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[3].className).toMatch(/today/i);
    expect(tabs[0].className).toMatch(/selected/i);
  });
});
