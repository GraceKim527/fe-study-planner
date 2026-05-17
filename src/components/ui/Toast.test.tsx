import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { Toast } from "./Toast";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("open=true일 때 메시지를 status role + aria-live=polite로 노출한다", () => {
    render(<Toast open message="저장되었습니다" onClose={() => {}} />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("저장되었습니다");
    // aria-live는 layer(부모)에 둠 — 같은 region 안 변경을 polite로 안내
    expect(status.parentElement).toHaveAttribute("aria-live", "polite");
  });

  it("open=false면 렌더하지 않는다", () => {
    render(<Toast open={false} message="안 보임" onClose={() => {}} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("durationMs 후 onClose가 호출된다", () => {
    const onClose = vi.fn();
    render(<Toast open message="hi" durationMs={2000} onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("error tone은 conflict 색 클래스를 적용한다", () => {
    render(<Toast open message="실패" tone="error" onClose={() => {}} />);
    const toast = screen.getByRole("status");
    // module css 해시는 'error' 키워드를 포함
    expect(toast.className).toMatch(/error/i);
  });
});
