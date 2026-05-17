import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlockEditor, validate } from "./BlockEditor";
import type { Course, EditableStudyBlock } from "@/types";

afterEach(cleanup);

const COURSES: Course[] = [
  { id: "c1", title: "수학", color: "#22C55E" },
  { id: "c2", title: "영어", color: "#3B82F6" },
];

describe("validate", () => {
  it("강의 미선택은 에러", () => {
    const e = validate({ courseId: "", dayOfWeek: 0, startTime: "09:00", endTime: "10:00" });
    expect(e.courseId).toBeDefined();
  });
  it("종료 ≤ 시작은 에러", () => {
    const e = validate({ courseId: "c1", dayOfWeek: 0, startTime: "10:00", endTime: "10:00" });
    expect(e.endTime).toBeDefined();
  });
  it("정상 입력은 에러 없음", () => {
    const e = validate({ courseId: "c1", dayOfWeek: 0, startTime: "09:00", endTime: "10:00" });
    expect(e).toEqual({});
  });
});

describe("BlockEditor (create)", () => {
  it("create 모드 초기값은 모두 빈 값", () => {
    render(
      <BlockEditor open mode="create" courses={COURSES} onSubmit={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByLabelText(/강의/)).toHaveValue("");
    // 요일은 7개 radio 버튼, 초기엔 어느 것도 선택되지 않음.
    const dayBtns = screen.getAllByRole("radio");
    expect(dayBtns).toHaveLength(7);
    expect(dayBtns.every((b) => b.getAttribute("aria-checked") === "false")).toBe(true);
    expect(screen.getByRole("combobox", { name: "시작 시" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "시작 분" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "종료 시" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "종료 분" })).toHaveValue("");
  });

  it("필수값 미입력 상태에서 추가 누르면 onSubmit 차단 + 에러 표시", async () => {
    const onSubmit = vi.fn();
    render(
      <BlockEditor open mode="create" courses={COURSES} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "추가" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("강의를 선택해주세요.")).toBeInTheDocument();
    expect(screen.getByText("요일을 선택해주세요.")).toBeInTheDocument();
  });

  it("모든 필수값 채우고 추가하면 onSubmit 호출", async () => {
    const onSubmit = vi.fn();
    render(
      <BlockEditor open mode="create" courses={COURSES} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await userEvent.click(screen.getByLabelText(/강의/));
    await userEvent.click(screen.getByRole("option", { name: "영어" }));
    await userEvent.click(screen.getByRole("radio", { name: "수" }));
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "시작 시" }), "09");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "시작 분" }), "00");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "종료 시" }), "10");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "종료 분" }), "30");
    await userEvent.click(screen.getByRole("button", { name: "추가" }));
    expect(onSubmit).toHaveBeenCalledWith({
      courseId: "c2",
      dayOfWeek: 2,
      startTime: "09:00",
      endTime: "10:30",
      memo: undefined,
    });
  });

  it("종료 ≤ 시작이면 에러 표시 + onSubmit 차단", async () => {
    const onSubmit = vi.fn();
    render(
      <BlockEditor open mode="create" courses={COURSES} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await userEvent.click(screen.getByLabelText(/강의/));
    await userEvent.click(screen.getByRole("option", { name: "수학" }));
    await userEvent.click(screen.getByRole("radio", { name: "월" }));
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "시작 시" }), "10");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "시작 분" }), "00");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "종료 시" }), "10");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "종료 분" }), "00");
    await userEvent.click(screen.getByRole("button", { name: "추가" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText("종료 시간은 시작 시간보다 늦어야 합니다."),
    ).toBeInTheDocument();
  });

  it("종료 시가 20일 땐 30분 옵션은 disabled (그리드 범위 초과)", async () => {
    render(
      <BlockEditor open mode="create" courses={COURSES} onSubmit={vi.fn()} onClose={vi.fn()} />,
    );
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "종료 시" }), "20");
    const endMin = screen.getByRole("combobox", { name: "종료 분" });
    const halfOption = Array.from(endMin.querySelectorAll("option")).find(
      (o) => o.value === "30",
    );
    expect(halfOption).toBeDefined();
    expect(halfOption?.disabled).toBe(true);
  });

  it("취소 클릭 시 onClose 호출", async () => {
    const onClose = vi.fn();
    render(
      <BlockEditor open mode="create" courses={COURSES} onSubmit={vi.fn()} onClose={onClose} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("메모 글자수 카운트가 표시된다", async () => {
    render(
      <BlockEditor open mode="create" courses={COURSES} onSubmit={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByText("0 / 200")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("메모 (선택)"), "안녕");
    expect(screen.getByText("2 / 200")).toBeInTheDocument();
  });
});

describe("BlockEditor (edit)", () => {
  const initial: EditableStudyBlock = {
    id: "b1",
    courseId: "c2",
    dayOfWeek: 3,
    startTime: "13:00",
    endTime: "14:30",
    memo: "기말",
  };

  it("initial 값이 채워지고, 삭제 버튼이 노출된다", () => {
    render(
      <BlockEditor
        open
        mode="edit"
        initial={initial}
        courses={COURSES}
        onSubmit={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/강의/)).toHaveValue("영어");
    // dayOfWeek=3 → 목요일.
    expect(screen.getByRole("radio", { name: "목" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("combobox", { name: "시작 시" })).toHaveValue("13");
    expect(screen.getByRole("combobox", { name: "시작 분" })).toHaveValue("00");
    expect(screen.getByRole("combobox", { name: "종료 시" })).toHaveValue("14");
    expect(screen.getByRole("combobox", { name: "종료 분" })).toHaveValue("30");
    expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument();
  });

  it("삭제 버튼이 onDelete를 호출", async () => {
    const onDelete = vi.fn();
    render(
      <BlockEditor
        open
        mode="edit"
        initial={initial}
        courses={COURSES}
        onSubmit={vi.fn()}
        onDelete={onDelete}
        onClose={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(onDelete).toHaveBeenCalled();
  });
});
