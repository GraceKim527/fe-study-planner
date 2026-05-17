"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { Course, DayOfWeek, EditableStudyBlock, TimeString } from "@/types";
import { timeToMinutes } from "@/lib/time";
import { Modal } from "@/components/ui/Modal";
import { Combobox } from "@/components/ui/Combobox";
import { TimePicker } from "./TimePicker";
import styles from "./BlockEditor.module.css";

export interface BlockDraft {
  courseId: string;
  dayOfWeek: DayOfWeek;
  startTime: TimeString;
  endTime: TimeString;
  memo?: string;
}

// 폼 입력 중 상태. create 모드는 미선택을 표현해야 해서 옵셔널.
interface FormState {
  courseId: string;
  dayOfWeek: DayOfWeek | null;
  startTime: TimeString;
  endTime: TimeString;
  memo: string;
}

interface Props {
  open: boolean;
  mode: "create" | "edit";
  // 편집 모드: 기존 블록. 추가 모드: 부분 기본값(빈 슬롯 클릭 시 day/startTime 채워서 넘김)도 받을 수 있다.
  initial?: EditableStudyBlock | Partial<BlockDraft>;
  courses: Course[];
  onSubmit(draft: BlockDraft): void;
  onDelete?(): void;
  onClose(): void;
  // 그리드 범위와 동기화. 명세 기본값 08:00~20:00.
  startHour?: number;
  endHour?: number;
}

const DAY_OPTIONS: Array<{ value: DayOfWeek; label: string }> = [
  { value: 0, label: "월" },
  { value: 1, label: "화" },
  { value: 2, label: "수" },
  { value: 3, label: "목" },
  { value: 4, label: "금" },
  { value: 5, label: "토" },
  { value: 6, label: "일" },
];

const MEMO_MAX = 200;

export function BlockEditor({
  open,
  mode,
  initial,
  courses,
  onSubmit,
  onDelete,
  onClose,
  startHour = 8,
  endHour = 20,
}: Props) {
  const defaults = useMemo<FormState>(() => ({
    courseId: initial?.courseId ?? "",
    dayOfWeek: initial?.dayOfWeek ?? null,
    startTime: initial?.startTime ?? "",
    endTime: initial?.endTime ?? "",
    memo: initial?.memo ?? "",
  }), [initial]);

  // 폼 상태는 한 번만 초기화. 다시 열거나 다른 블록을 편집하려면 부모가 key를 갈아끼워 리마운트해야 한다.
  const [form, setForm] = useState<FormState>(defaults);
  const [submitted, setSubmitted] = useState(false);

  const errors = validateForm(form, { startHour, endHour });
  const hasError = Object.keys(errors).length > 0;

  const courseId = useId();
  const dayId = useId();
  const startGroupId = useId();
  const endGroupId = useId();
  const memoId = useId();
  const memoCountId = useId();
  const timeErrId = useId();
  const courseErrId = useId();
  const dayErrId = useId();

  const startHourRef = useRef<HTMLSelectElement>(null);
  const dayRef = useRef<HTMLButtonElement>(null);
  const courseInputRef = useRef<HTMLInputElement | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (hasError) {
      // 위에서부터 첫 에러 필드로 포커스.
      if (errors.courseId) courseInputRef.current?.focus();
      else if (errors.dayOfWeek) dayRef.current?.focus();
      else if (errors.startTime || errors.endTime) startHourRef.current?.focus();
      return;
    }
    onSubmit({
      courseId: form.courseId,
      dayOfWeek: form.dayOfWeek as DayOfWeek,
      startTime: form.startTime,
      endTime: form.endTime,
      memo: form.memo.trim() || undefined,
    });
  }

  function showError<K extends keyof typeof errors>(field: K) {
    return submitted && errors[field];
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "새 학습 블록" : "학습 블록 편집"}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor={courseId}>
            강의<RequiredMark />
          </label>
          <Combobox
            id={courseId}
            value={form.courseId}
            options={courses.map((c) => ({ value: c.id, label: c.title }))}
            onChange={(v) => setForm({ ...form, courseId: v })}
            placeholder="강의를 검색하거나 선택하세요"
            required
            ariaInvalid={showError("courseId") ? true : undefined}
            ariaDescribedBy={showError("courseId") ? courseErrId : undefined}
            inputRef={courseInputRef}
          />
          {showError("courseId") && (
            <p id={courseErrId} className={styles.error}>{errors.courseId}</p>
          )}
        </div>

        <div className={styles.field}>
          <span id={dayId} className={styles.groupLabel}>
            요일<RequiredMark />
          </span>
          <div
            className={styles.dayGroup}
            role="radiogroup"
            aria-labelledby={dayId}
            aria-invalid={showError("dayOfWeek") ? true : undefined}
            aria-describedby={showError("dayOfWeek") ? dayErrId : undefined}
          >
            {DAY_OPTIONS.map((d, idx) => {
              const selected = form.dayOfWeek === d.value;
              return (
                <button
                  key={d.value}
                  ref={idx === 0 ? dayRef : undefined}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`${styles.dayBtn} ${selected ? styles.dayBtnSelected : ""}`}
                  onClick={() => setForm({ ...form, dayOfWeek: d.value })}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
          {showError("dayOfWeek") && (
            <p id={dayErrId} className={styles.error}>{errors.dayOfWeek}</p>
          )}
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <span id={startGroupId} className={styles.groupLabel}>
              시작<RequiredMark />
            </span>
            <TimePicker
              role="start"
              value={form.startTime}
              onChange={(v) => setForm({ ...form, startTime: v })}
              startHour={startHour}
              endHour={endHour}
              groupId={startGroupId}
              invalid={showError("startTime") || showError("endTime") ? true : undefined}
              describedBy={showError("startTime") || showError("endTime") ? timeErrId : undefined}
              hourRef={startHourRef}
            />
          </div>
          <div className={styles.field}>
            <span id={endGroupId} className={styles.groupLabel}>
              종료<RequiredMark />
            </span>
            <TimePicker
              role="end"
              value={form.endTime}
              onChange={(v) => setForm({ ...form, endTime: v })}
              startHour={startHour}
              endHour={endHour}
              groupId={endGroupId}
              invalid={showError("endTime") ? true : undefined}
              describedBy={showError("endTime") ? timeErrId : undefined}
            />
          </div>
        </div>
        {(showError("startTime") || showError("endTime")) && (
          <p id={timeErrId} className={styles.error}>
            {errors.endTime ?? errors.startTime}
          </p>
        )}

        <div className={styles.field}>
          <div className={styles.memoLabelRow}>
            <label htmlFor={memoId}>메모 (선택)</label>
            <span id={memoCountId} className={styles.memoCount} aria-live="polite">
              {form.memo.length} / {MEMO_MAX}
            </span>
          </div>
          <textarea
            id={memoId}
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
            rows={3}
            maxLength={MEMO_MAX}
            placeholder={`최대 ${MEMO_MAX}자까지 입력 가능합니다`}
            aria-describedby={memoCountId}
          />
        </div>

        <div className={styles.actions}>
          {mode === "edit" && onDelete && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={onDelete}
            >
              삭제
            </button>
          )}
          <div className={styles.spacer} />
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>
            취소
          </button>
          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
            {mode === "create" ? "추가" : "저장"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// 시각용 *, 스크린 리더는 "필수"로 읽도록 분리.
function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className={styles.required}>*</span>
      <span className={styles.srOnly}> 필수</span>
    </>
  );
}

// 모달 안에서는 폼 자체 유효성만 본다. 충돌 검사는 저장 단계에서.
function validateForm(form: FormState, range: { startHour: number; endHour: number } = { startHour: 8, endHour: 20 }) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.courseId) errors.courseId = "강의를 선택해주세요.";
  if (form.dayOfWeek === null) errors.dayOfWeek = "요일을 선택해주세요.";
  if (!form.startTime) errors.startTime = "시작 시간을 입력해주세요.";
  if (!form.endTime) errors.endTime = "종료 시간을 입력해주세요.";
  if (form.startTime && form.endTime) {
    const start = timeToMinutes(form.startTime);
    const end = timeToMinutes(form.endTime);
    const min = range.startHour * 60;
    const max = range.endHour * 60;
    if (Number.isNaN(start)) errors.startTime = "시작 시간 형식이 올바르지 않습니다.";
    if (Number.isNaN(end)) errors.endTime = "종료 시간 형식이 올바르지 않습니다.";
    if (!Number.isNaN(start) && (start < min || start >= max)) {
      errors.startTime = `시작은 ${pad(range.startHour)}:00~${pad(range.endHour)}:00 사이여야 합니다.`;
    }
    if (!Number.isNaN(end) && (end <= min || end > max)) {
      errors.endTime = `종료는 ${pad(range.startHour)}:00~${pad(range.endHour)}:00 사이여야 합니다.`;
    }
    if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
      errors.endTime = "종료 시간은 시작 시간보다 늦어야 합니다.";
    }
  }
  return errors;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// 외부 사용 호환 — BlockDraft 형태 입력에 대한 검증.
export function validate(draft: BlockDraft, range?: { startHour: number; endHour: number }) {
  return validateForm({
    courseId: draft.courseId,
    dayOfWeek: draft.dayOfWeek,
    startTime: draft.startTime,
    endTime: draft.endTime,
    memo: draft.memo ?? "",
  }, range);
}
