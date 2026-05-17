"use client";

import type { ApiErrorKind } from "@/api/client";
import styles from "./SaveBar.module.css";

interface Props {
  dirty: boolean;
  changeCount: number;
  isSaving: boolean;
  errorKind?: ApiErrorKind;
  errorMessage?: string;
  onSave(): void;
  onReset(): void;
}

// 저장 실패 시 메시지를 사용자 표현으로 매핑.
function describeError(kind?: ApiErrorKind, fallback?: string): string {
  switch (kind) {
    case "TIME_CONFLICT":
      return "겹치는 학습 블록이 있습니다. 시간을 조정해 주세요.";
    case "INVALID_TIME_RANGE":
      return "종료 시간이 시작 시간보다 빠른 블록이 있습니다.";
    case "INVALID_BLOCK":
      return "블록 정보가 올바르지 않습니다.";
    case "NETWORK":
      return "네트워크가 불안정합니다. 잠시 후 다시 시도해 주세요.";
    case "INVALID_RESPONSE":
      return "서버 응답을 해석할 수 없습니다.";
    default:
      return fallback ?? "저장에 실패했습니다.";
  }
}

export function SaveBar({
  dirty,
  changeCount,
  isSaving,
  errorKind,
  errorMessage,
  onSave,
  onReset,
}: Props) {
  const showError = !!errorKind;
  const disabled = !dirty || isSaving;

  return (
    <div
      className={`${styles.bar} ${dirty ? styles.barDirty : ""} ${showError ? styles.barError : ""}`}
      role="region"
      aria-label="저장 영역"
    >
      <div className={styles.status}>
        {showError ? (
          <span className={styles.errorText} role="alert">
            {describeError(errorKind, errorMessage)}
          </span>
        ) : dirty ? (
          <span className={styles.dirtyText}>변경사항 {changeCount}개</span>
        ) : (
          <span className={styles.cleanText}>변경사항 없음</span>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.resetBtn}
          onClick={onReset}
          disabled={!dirty || isSaving}
        >
          되돌리기
        </button>
        <button
          type="button"
          className={styles.saveBtn}
          onClick={onSave}
          disabled={disabled}
          aria-busy={isSaving}
        >
          {isSaving ? (
            <>
              <span className={styles.spinner} aria-hidden />
              저장 중...
            </>
          ) : (
            "저장하기"
          )}
        </button>
      </div>
    </div>
  );
}
