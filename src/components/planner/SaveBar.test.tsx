import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SaveBar } from "./SaveBar";

afterEach(cleanup);

describe("SaveBar", () => {
  it("not dirty 상태에선 두 버튼 모두 비활성, '변경사항 없음' 표시", () => {
    render(
      <SaveBar dirty={false} changeCount={0} isSaving={false} onSave={vi.fn()} onReset={vi.fn()} />,
    );
    expect(screen.getByText("변경사항 없음")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "저장하기" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "되돌리기" })).toBeDisabled();
  });

  it("dirty 상태에선 변경 카운트 + 두 버튼 활성", async () => {
    const onSave = vi.fn();
    const onReset = vi.fn();
    const user = userEvent.setup();
    render(
      <SaveBar dirty changeCount={3} isSaving={false} onSave={onSave} onReset={onReset} />,
    );

    expect(screen.getByText("변경사항 3개")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "저장하기" }));
    expect(onSave).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "되돌리기" }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("저장 중에는 라벨이 '저장 중...'으로 바뀌고 두 버튼 비활성, aria-busy", () => {
    render(
      <SaveBar dirty changeCount={2} isSaving onSave={vi.fn()} onReset={vi.fn()} />,
    );
    const saveBtn = screen.getByRole("button", { name: /저장 중/ });
    expect(saveBtn).toBeDisabled();
    expect(saveBtn).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "되돌리기" })).toBeDisabled();
  });

  it("TIME_CONFLICT 에러는 사용자 친화적 메시지로 보여주고 role=alert", () => {
    render(
      <SaveBar
        dirty
        changeCount={1}
        isSaving={false}
        errorKind="TIME_CONFLICT"
        errorMessage="겹치는 학습 블록이 있습니다."
        onSave={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/겹치는 학습 블록/);
  });

  it("NETWORK 에러는 fallback 매핑 메시지로 표시", () => {
    render(
      <SaveBar
        dirty
        changeCount={1}
        isSaving={false}
        errorKind="NETWORK"
        onSave={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByText(/네트워크가 불안정/)).toBeInTheDocument();
  });
});
