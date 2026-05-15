"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { Course, DayOfWeek, EditableStudyBlock, TimeString } from "@/types";
import { generateTimeSlots, timeToMinutes } from "@/lib/time";
import { Modal } from "@/components/ui/Modal";
import styles from "./BlockEditor.module.css";

export interface BlockDraft {
  courseId: string;
  dayOfWeek: DayOfWeek;
  startTime: TimeString;
  endTime: TimeString;
  memo?: string;
}

interface Props {
  open: boolean;
  mode: "create" | "edit";
  initial?: EditableStudyBlock;
  courses: Course[];
  // 추가/수정 확정. 부모가 store에 반영.
  onSubmit(draft: BlockDraft): void;
  // 편집 모드에서만 의미 있음.
  onDelete?(): void;
  onClose(): void;
  // 그리드의 시간 범위와 동일하게 유지.
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

const SLOT_MINUTES = 30;

export function BlockEditor({
  open,
  mode,
  initial,
  courses,
  onSubmit,
  onDelete,
  onClose,
  startHour = 8,
  endHour = 22,
}: Props) {
  const slots = useMemo(
    () => generateTimeSlots(startHour, endHour, SLOT_MINUTES),
    [startHour, endHour],
  );

  const defaults = useMemo<BlockDraft>(() => {
    if (initial) {
      return {
        courseId: initial.courseId,
        dayOfWeek: initial.dayOfWeek,
        startTime: initial.startTime,
        endTime: initial.endTime,
        memo: initial.memo ?? "",
      };
    }
    return {
      courseId: courses[0]?.id ?? "",
      dayOfWeek: 0,
      startTime: slots[0] ?? "09:00",
      endTime: slots[2] ?? "10:00",
      memo: "",
    };
  }, [initial, courses, slots]);

  // 폼 상태는 한 번만 초기화. 다시 열거나 다른 블록을 편집하려면 부모가 key를 갈아끼워 리마운트해야 한다.
  const [draft, setDraft] = useState<BlockDraft>(defaults);
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(draft);
  const hasError = Object.keys(errors).length > 0;

  const courseId = useId();
  const dayId = useId();
  const startId = useId();
  const endId = useId();
  const memoId = useId();
  const startErrId = useId();
  const endErrId = useId();
  const courseErrId = useId();

  const startTimeRef = useRef<HTMLSelectElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (hasError) {
      // 첫 에러 필드로 포커스. 시간 에러가 가장 흔하므로 시간부터.
      if (errors.endTime || errors.startTime) startTimeRef.current?.focus();
      return;
    }
    onSubmit({ ...draft, memo: draft.memo?.trim() || undefined });
  }

  function showError(field: keyof BlockDraft) {
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
          <label htmlFor={courseId}>강의</label>
          <select
            id={courseId}
            value={draft.courseId}
            onChange={(e) => setDraft({ ...draft, courseId: e.target.value })}
            aria-invalid={showError("courseId") ? true : undefined}
            aria-describedby={showError("courseId") ? courseErrId : undefined}
          >
            {courses.length === 0 && <option value="">강의 없음</option>}
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          {showError("courseId") && (
            <p id={courseErrId} className={styles.error}>{errors.courseId}</p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor={dayId}>요일</label>
          <select
            id={dayId}
            value={draft.dayOfWeek}
            onChange={(e) => setDraft({ ...draft, dayOfWeek: Number(e.target.value) as DayOfWeek })}
          >
            {DAY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor={startId}>시작</label>
            <select
              id={startId}
              ref={startTimeRef}
              value={draft.startTime}
              onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
              aria-invalid={showError("startTime") || showError("endTime") ? true : undefined}
              aria-describedby={showError("startTime") || showError("endTime") ? startErrId : undefined}
            >
              {slots.slice(0, -1).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor={endId}>종료</label>
            <select
              id={endId}
              value={draft.endTime}
              onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
              aria-invalid={showError("endTime") ? true : undefined}
              aria-describedby={showError("endTime") ? endErrId : undefined}
            >
              {slots.slice(1).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        {(showError("startTime") || showError("endTime")) && (
          <p id={startErrId} className={styles.error}>
            {errors.endTime ?? errors.startTime}
          </p>
        )}

        <div className={styles.field}>
          <label htmlFor={memoId}>메모 (선택)</label>
          <textarea
            id={memoId}
            value={draft.memo ?? ""}
            onChange={(e) => setDraft({ ...draft, memo: e.target.value })}
            rows={3}
            maxLength={200}
            placeholder="간단한 메모"
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

// 모달 안에서는 폼 자체 유효성만 본다. 충돌 검사는 저장 단계에서.
export function validate(draft: BlockDraft): Partial<Record<keyof BlockDraft, string>> {
  const errors: Partial<Record<keyof BlockDraft, string>> = {};
  if (!draft.courseId) errors.courseId = "강의를 선택해주세요.";
  const start = timeToMinutes(draft.startTime);
  const end = timeToMinutes(draft.endTime);
  if (Number.isNaN(start)) errors.startTime = "시작 시간을 선택해주세요.";
  if (Number.isNaN(end)) errors.endTime = "종료 시간을 선택해주세요.";
  if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
    errors.endTime = "종료 시간은 시작 시간보다 늦어야 합니다.";
  }
  return errors;
}
