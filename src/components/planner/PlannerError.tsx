"use client";

import styles from "./PlannerError.module.css";

interface Props {
  message?: string;
  onRetry?(): void;
}

// 그리드 자리를 그대로 차지하는 에러 카드. 헤더는 page.tsx 서버 컴포넌트가 별도로 렌더한다.
export function PlannerError({ message, onRetry }: Props) {
  return (
    <div className={styles.wrapper} role="alert">
      <div className={styles.icon} aria-hidden>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
      </div>
      <h2 className={styles.title}>플래너를 불러오지 못했습니다</h2>
      <p className={styles.message}>
        {message ?? "잠시 후 다시 시도해주세요. 문제가 계속되면 새로고침해주세요."}
      </p>
      {onRetry && (
        <button type="button" className={styles.retryBtn} onClick={onRetry}>
          다시 시도
        </button>
      )}
    </div>
  );
}
