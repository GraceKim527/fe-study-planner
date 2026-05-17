import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SaveBar } from "./SaveBar";

afterEach(cleanup);

describe("SaveBar", () => {
  it("변경 카운트와 두 버튼이 활성으로 표시되고 클릭 시 핸들러 호출", async () => {
    const onSave = vi.fn();
    const onReset = vi.fn();
    const user = userEvent.setup();
    render(
      <SaveBar changeCount={3} conflictCount={0} isSaving={false} onSave={onSave} onReset={onReset} />,
    );

    expect(screen.getByText("변경사항 3개")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "저장하기" }));
    expect(onSave).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "되돌리기" }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("저장 중에는 라벨이 '저장 중...'으로 바뀌고 두 버튼 비활성, aria-busy", () => {
    render(
      <SaveBar changeCount={2} conflictCount={0} isSaving onSave={vi.fn()} onReset={vi.fn()} />,
    );
    const saveBtn = screen.getByRole("button", { name: /저장 중/ });
    expect(saveBtn).toBeDisabled();
    expect(saveBtn).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "되돌리기" })).toBeDisabled();
  });

  it("conflictCount > 0이면 경고 메시지 + 저장 버튼 disabled (되돌리기는 활성)", () => {
    render(
      <SaveBar
        changeCount={2}
        conflictCount={2}
        isSaving={false}
        onSave={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/시간이 겹치는 블록 2개/);
    expect(screen.getByRole("button", { name: "저장하기" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "되돌리기" })).toBeEnabled();
  });

  it("API 에러가 충돌 경고보다 우선 표시된다", () => {
    render(
      <SaveBar
        changeCount={1}
        conflictCount={1}
        isSaving={false}
        errorKind="NETWORK"
        onSave={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByText(/네트워크가 불안정/)).toBeInTheDocument();
    expect(screen.queryByText(/시간이 겹치는 블록/)).not.toBeInTheDocument();
  });

  it("TIME_CONFLICT 에러는 사용자 친화적 메시지로 보여주고 role=alert", () => {
    render(
      <SaveBar
        changeCount={1}
        conflictCount={0}
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
        changeCount={1}
        conflictCount={0}
        isSaving={false}
        errorKind="NETWORK"
        onSave={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByText(/네트워크가 불안정/)).toBeInTheDocument();
  });
});
