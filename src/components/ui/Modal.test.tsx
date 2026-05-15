import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

afterEach(cleanup);

function Harness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button data-testid="opener">opener</button>
      <Modal
        open={open}
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
        title="블록 추가"
      >
        <button>첫 버튼</button>
        <input aria-label="텍스트" />
        <button>마지막 버튼</button>
      </Modal>
    </>
  );
}

describe("Modal", () => {
  it("role/aria 속성과 제목이 렌더된다", () => {
    render(<Harness />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("heading", { name: "블록 추가" })).toBeInTheDocument();
  });

  it("ESC로 닫힌다", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("배경 클릭으로 닫힌다", async () => {
    const onClose = vi.fn();
    const { container } = render(<Harness onClose={onClose} />);
    const backdrop = container.ownerDocument.querySelector("[class*='backdrop']");
    expect(backdrop).not.toBeNull();
    await userEvent.pointer({ keys: "[MouseLeft>]", target: backdrop! });
    await userEvent.pointer({ keys: "[/MouseLeft]", target: backdrop! });
    expect(onClose).toHaveBeenCalled();
  });

  it("닫기 버튼으로 닫힌다", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // user-event는 jsdom에서 keydown 직후 focus를 즉시 옮겨버려 trap 비교가 깨진다 → fireEvent로 keydown만 발생시켜 검증.
  // header의 닫기 버튼이 DOM 첫 → focusable 순서는 [닫기, 첫버튼, 텍스트, 마지막버튼].
  it("Tab이 마지막에서 첫 요소로 순환한다", () => {
    render(<Harness />);
    const first = screen.getByRole("button", { name: "닫기" });
    const last = screen.getByRole("button", { name: "마지막 버튼" });
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(first).toHaveFocus();
  });

  it("Shift+Tab이 첫 요소에서 마지막 요소로 순환한다", () => {
    render(<Harness />);
    const first = screen.getByRole("button", { name: "닫기" });
    const last = screen.getByRole("button", { name: "마지막 버튼" });
    first.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });

  it("닫힌 뒤 직전 활성 요소로 포커스가 복원된다", async () => {
    function Wrapper() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button data-testid="trigger" onClick={() => setOpen(true)}>열기</button>
          <Modal open={open} onClose={() => setOpen(false)} title="t">
            <button>안쪽</button>
          </Modal>
        </>
      );
    }
    render(<Wrapper />);
    const trigger = screen.getByTestId("trigger");
    trigger.focus();
    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });
});
