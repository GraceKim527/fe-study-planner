"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MutableRefObject,
} from "react";
import styles from "./Combobox.module.css";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface Props {
  id?: string;
  value: string;
  options: ComboboxOption[];
  onChange(value: string): void;
  placeholder?: string;
  emptyMessage?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  required?: boolean;
  inputRef?: MutableRefObject<HTMLInputElement | null>;
}

// WAI-ARIA Authoring Practices의 combobox 패턴 (편집 가능 input + 리스트박스).
// - 입력하면 옵션이 좁혀짐. 좁혀진 결과 중 ↑/↓로 highlight 이동, Enter로 선택.
// - 선택 시 input 텍스트는 옵션 label로 동기화.
// - 외부 클릭/ESC/Tab으로 닫힘.
export function Combobox({
  id,
  value,
  options,
  onChange,
  placeholder,
  emptyMessage = "검색 결과가 없습니다.",
  ariaLabelledBy,
  ariaDescribedBy,
  ariaInvalid,
  required,
  inputRef: externalInputRef,
}: Props) {
  const reactId = useId();
  const inputId = id ?? `${reactId}-input`;
  const listId = `${reactId}-list`;

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  // 닫힌 상태에서는 항상 선택값의 label을 표시. 열려서 사용자가 입력하기 시작하면 그 텍스트 우선.
  const [draftQuery, setDraftQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [highlightRaw, setHighlightRaw] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const display = draftQuery ?? selected?.label ?? "";

  // 열려 있을 때만 필터. draftQuery가 null이면(=아직 타이핑 안 함) 전체.
  const filtered = useMemo(() => {
    if (!open || draftQuery === null) return options;
    const q = draftQuery.trim().toLowerCase();
    if (q.length === 0) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [open, options, draftQuery]);

  // highlight는 사용 시점에 clamp — effect로 동기화하지 않는다.
  const highlight =
    filtered.length === 0 ? 0 : Math.min(highlightRaw, filtered.length - 1);

  // 외부 클릭으로 닫기. 모달 안에서 동작해야 하므로 mousedown 캡처.
  useEffect(() => {
    if (!open) return;
    function onDocDown(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setDraftQuery(null);
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  // 열린 상태에서 highlight가 바뀌면 시야로 스크롤.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const item = list.querySelector<HTMLLIElement>(
      `[data-index="${highlight}"]`,
    );
    item?.scrollIntoView?.({ block: "nearest" });
  }, [open, highlight]);

  function openList() {
    setOpen(true);
    const idx = options.findIndex((o) => o.value === value);
    setHighlightRaw(idx >= 0 ? idx : 0);
  }

  function selectOption(opt: ComboboxOption) {
    onChange(opt.value);
    setDraftQuery(null);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setHighlightRaw((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setHighlightRaw((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      const opt = filtered[highlight];
      if (opt) selectOption(opt);
    } else if (e.key === "Escape") {
      if (!open) return;
      e.preventDefault();
      e.stopPropagation();
      setDraftQuery(null);
      setOpen(false);
    } else if (e.key === "Tab") {
      if (open) {
        setDraftQuery(null);
        setOpen(false);
      }
    }
  }

  const activeId =
    open && filtered[highlight] ? `${listId}-opt-${highlight}` : undefined;

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <input
        id={inputId}
        ref={(node) => {
          inputRef.current = node;
          if (externalInputRef) externalInputRef.current = node;
        }}
        type="text"
        role="combobox"
        autoComplete="off"
        spellCheck={false}
        className={styles.input}
        value={display}
        placeholder={placeholder}
        required={required}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        onChange={(e) => {
          setDraftQuery(e.target.value);
          if (!open) setOpen(true);
          setHighlightRaw(0);
        }}
        onFocus={() => {
          if (!open) openList();
        }}
        onClick={() => {
          if (!open) openList();
        }}
        onKeyDown={onKeyDown}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={open ? "목록 닫기" : "목록 열기"}
        className={styles.toggle}
        onMouseDown={(e) => {
          // input blur 전에 토글 동작이 일어나도록 default 막음.
          e.preventDefault();
          if (open) {
            setDraftQuery(null);
            setOpen(false);
          } else {
            inputRef.current?.focus();
            openList();
          }
        }}
      >
        <Chevron open={open} />
      </button>
      {open && (
        <ul id={listId} ref={listRef} role="listbox" className={styles.list}>
          {filtered.length === 0 ? (
            <li className={styles.empty}>{emptyMessage}</li>
          ) : (
            filtered.map((opt, i) => {
              const isSelected = opt.value === value;
              const isHighlighted = i === highlight;
              return (
                <li
                  key={opt.value}
                  id={`${listId}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  data-index={i}
                  className={`${styles.option} ${isHighlighted ? styles.highlighted : ""} ${isSelected ? styles.selected : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectOption(opt);
                  }}
                  onMouseEnter={() => setHighlightRaw(i)}
                >
                  {opt.label}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="8"
      viewBox="0 0 12 8"
      fill="none"
      aria-hidden
      style={{
        transform: open ? "rotate(180deg)" : undefined,
        transition: "transform 150ms ease",
      }}
    >
      <path
        d="M1 1.5L6 6.5L11 1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
