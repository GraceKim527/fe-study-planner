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

  it("selected 탭만 tabIndex=0, 나머지는 -1 (roving tabindex)", () => {
    render(<DayTabs selected={2} dayDates={dayDates} onChange={() => {}} />);
    const tabs = screen.getAllByRole("tab");
    tabs.forEach((tab, i) => {
      expect(tab).toHaveAttribute("tabindex", i === 2 ? "0" : "-1");
    });
  });

  it("ArrowRight는 다음 요일로 onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DayTabs selected={2} dayDates={dayDates} onChange={onChange} />);
    screen.getAllByRole("tab")[2].focus();

    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it("ArrowLeft는 이전 요일로 onChange (월에서 누르면 일로 순환)", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DayTabs selected={0} dayDates={dayDates} onChange={onChange} />);
    screen.getAllByRole("tab")[0].focus();

    await user.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith(6);
  });

  it("Home/End로 첫·마지막 요일 이동", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DayTabs selected={3} dayDates={dayDates} onChange={onChange} />);
    const tabs = screen.getAllByRole("tab");
    tabs[3].focus();

    await user.keyboard("{End}");
    expect(onChange).toHaveBeenLastCalledWith(6);

    await user.keyboard("{Home}");
    expect(onChange).toHaveBeenLastCalledWith(0);
  });
});
