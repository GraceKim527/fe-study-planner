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
  it("초기값이 기본 강의/요일/시간으로 채워진다", () => {
    render(
      <BlockEditor open mode="create" courses={COURSES} onSubmit={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByLabelText("강의")).toHaveValue("c1");
    expect(screen.getByLabelText("요일")).toHaveValue("0");
  });

  it("유효한 입력으로 추가하면 onSubmit이 호출된다", async () => {
    const onSubmit = vi.fn();
    render(
      <BlockEditor open mode="create" courses={COURSES} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await userEvent.selectOptions(screen.getByLabelText("강의"), "c2");
    await userEvent.click(screen.getByRole("button", { name: "추가" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ courseId: "c2" }));
  });

  it("종료 ≤ 시작이면 에러 표시 + onSubmit 차단", async () => {
    const onSubmit = vi.fn();
    render(
      <BlockEditor open mode="create" courses={COURSES} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await userEvent.selectOptions(screen.getByLabelText("시작"), "10:00");
    await userEvent.selectOptions(screen.getByLabelText("종료"), "10:00");
    await userEvent.click(screen.getByRole("button", { name: "추가" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText("종료 시간은 시작 시간보다 늦어야 합니다."),
    ).toBeInTheDocument();
  });

  it("취소 클릭 시 onClose 호출", async () => {
    const onClose = vi.fn();
    render(
      <BlockEditor open mode="create" courses={COURSES} onSubmit={vi.fn()} onClose={onClose} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("memo 공백만 있으면 undefined로 정리되어 전달", async () => {
    const onSubmit = vi.fn();
    render(
      <BlockEditor open mode="create" courses={COURSES} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await userEvent.type(screen.getByLabelText("메모 (선택)"), "   ");
    await userEvent.click(screen.getByRole("button", { name: "추가" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ memo: undefined }));
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
    expect(screen.getByLabelText("강의")).toHaveValue("c2");
    expect(screen.getByLabelText("요일")).toHaveValue("3");
    expect(screen.getByLabelText("시작")).toHaveValue("13:00");
    expect(screen.getByLabelText("종료")).toHaveValue("14:30");
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
