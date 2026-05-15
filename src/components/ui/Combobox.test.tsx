import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Combobox, type ComboboxOption } from "./Combobox";

afterEach(cleanup);

const OPTIONS: ComboboxOption[] = [
  { value: "react", label: "React 심화" },
  { value: "ts", label: "TypeScript 실전" },
  { value: "next", label: "Next.js 16" },
  { value: "css", label: "CSS 설계" },
];

function Harness({ initial = "", onChange }: { initial?: string; onChange?: (v: string) => void }) {
  const [v, setV] = useState(initial);
  return (
    <Combobox
      value={v}
      options={OPTIONS}
      onChange={(nv) => {
        setV(nv);
        onChange?.(nv);
      }}
      placeholder="검색"
    />
  );
}

describe("Combobox", () => {
  it("input 클릭 시 listbox가 열리고 모든 옵션이 보인다", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(OPTIONS.length);
  });

  it("타이핑하면 부분 일치로 옵션이 좁혀진다", async () => {
    render(<Harness />);
    const input = screen.getByRole("combobox");
    await userEvent.click(input);
    await userEvent.type(input, "type");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("TypeScript 실전");
  });

  it("일치하는 옵션이 없으면 빈 메시지", async () => {
    render(<Harness />);
    const input = screen.getByRole("combobox");
    await userEvent.click(input);
    await userEvent.type(input, "zzz");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("검색 결과가 없습니다.")).toBeInTheDocument();
  });

  it("옵션 클릭 시 onChange + input 텍스트 동기화 + 닫힘", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByRole("combobox");
    await userEvent.click(input);
    await userEvent.click(screen.getByRole("option", { name: "Next.js 16" }));
    expect(onChange).toHaveBeenCalledWith("next");
    expect(input).toHaveValue("Next.js 16");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("↓로 highlight 이동, Enter로 선택", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByRole("combobox");
    input.focus();
    // 포커스만으로도 열린다(onFocus). highlight=0(React 심화)에서 ↓ 한 번 → TypeScript
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenCalledWith("ts");
    expect(input).toHaveValue("TypeScript 실전");
  });

  it("ESC는 입력값을 기존 선택 라벨로 되돌리고 닫는다", async () => {
    const onChange = vi.fn();
    render(<Harness initial="react" onChange={onChange} />);
    const input = screen.getByRole("combobox");
    expect(input).toHaveValue("React 심화");
    await userEvent.click(input);
    await userEvent.type(input, "Type");
    await userEvent.keyboard("{Escape}");
    expect(input).toHaveValue("React 심화");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("초기 value가 있으면 input에 라벨이 채워진다", () => {
    render(<Harness initial="css" />);
    expect(screen.getByRole("combobox")).toHaveValue("CSS 설계");
  });
});
