import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { WeeklySummarySkeleton } from "./WeeklySummarySkeleton";

afterEach(cleanup);

describe("WeeklySummarySkeleton", () => {
  it("role=status + aria-busy + aria-label로 로딩 상태를 알린다", () => {
    render(<WeeklySummarySkeleton />);
    const region = screen.getByRole("status", { name: "주간 요약을 불러오는 중" });
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(region).toHaveAttribute("aria-live", "polite");
  });
});
