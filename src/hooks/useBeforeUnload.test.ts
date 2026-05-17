import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import { useBeforeUnload } from "./useBeforeUnload";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("useBeforeUnload", () => {
  it("when=true면 beforeunload 리스너를 등록한다", () => {
    const add = vi.spyOn(window, "addEventListener");
    renderHook(() => useBeforeUnload(true));
    const calls = add.mock.calls.filter(([type]) => type === "beforeunload");
    expect(calls).toHaveLength(1);
  });

  it("when=false면 리스너를 등록하지 않는다", () => {
    const add = vi.spyOn(window, "addEventListener");
    renderHook(() => useBeforeUnload(false));
    const calls = add.mock.calls.filter(([type]) => type === "beforeunload");
    expect(calls).toHaveLength(0);
  });

  it("언마운트 시 리스너를 해제한다", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useBeforeUnload(true));
    unmount();
    const calls = remove.mock.calls.filter(([type]) => type === "beforeunload");
    expect(calls).toHaveLength(1);
  });

  it("when이 true→false로 바뀌면 리스너를 해제한다", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { rerender } = renderHook(({ when }) => useBeforeUnload(when), {
      initialProps: { when: true },
    });
    rerender({ when: false });
    const calls = remove.mock.calls.filter(([type]) => type === "beforeunload");
    expect(calls).toHaveLength(1);
  });

  it("등록된 핸들러는 preventDefault + returnValue를 세팅한다", () => {
    let captured: ((e: BeforeUnloadEvent) => void) | null = null;
    vi.spyOn(window, "addEventListener").mockImplementation((type, fn) => {
      if (type === "beforeunload") captured = fn as (e: BeforeUnloadEvent) => void;
    });
    renderHook(() => useBeforeUnload(true));
    expect(captured).not.toBeNull();

    const event = { preventDefault: vi.fn(), returnValue: "init" } as unknown as BeforeUnloadEvent;
    captured!(event);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(event.returnValue).toBe("");
  });
});
