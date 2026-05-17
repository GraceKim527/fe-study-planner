"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./Toast.module.css";

export type ToastTone = "success" | "error";

interface Props {
  open: boolean;
  message: string;
  tone?: ToastTone;
  durationMs?: number;
  onClose(): void;
}

// 비침습적 알림. role=status + aria-live=polite로 스크린 리더가 흐름을 깨지 않게 읽음.
// 같은 메시지가 연속으로 떠도 message 변경 시점마다 타이머 리셋.
export function Toast({ open, message, tone = "success", durationMs = 2500, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [open, message, durationMs, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className={styles.layer} aria-live="polite" aria-atomic="true">
      <div className={`${styles.toast} ${tone === "error" ? styles.error : styles.success}`} role="status">
        <span className={styles.icon} aria-hidden>
          {tone === "error" ? <ErrorIcon /> : <CheckIcon />}
        </span>
        <span>{message}</span>
      </div>
    </div>,
    document.body,
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.18" />
      <path
        d="M7.5 12.5L10.5 15.5L16.5 9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.18" />
      <path d="M12 7V13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1.1" fill="currentColor" />
    </svg>
  );
}
