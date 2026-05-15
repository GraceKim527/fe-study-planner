"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";

interface Props {
  open: boolean;
  onClose(): void;
  title: string;
  children: React.ReactNode;
  // 데스크톱 기본 너비. 모바일은 풀스크린.
  size?: "sm" | "md";
  // 폼 제출 진행 중처럼 닫기를 막아야 할 때 true.
  closeLocked?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, size = "md", closeLocked = false }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const lastActiveRef = useRef<Element | null>(null);

  // 마운트는 클라에서만. SSR 안전.
  const mounted = typeof window !== "undefined";

  // 열림/닫힘에 따른 포커스 복원·body 스크롤 락.
  useEffect(() => {
    if (!open) return;
    lastActiveRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 첫 focusable로 이동. 없으면 다이얼로그 자체.
    queueMicrotask(() => {
      const node = dialogRef.current;
      if (!node) return;
      const first = node.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? node).focus();
    });

    return () => {
      document.body.style.overflow = prevOverflow;
      const last = lastActiveRef.current;
      if (last instanceof HTMLElement) last.focus();
    };
  }, [open]);

  // 키보드: ESC 닫기 + Tab 순환.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (closeLocked) return;
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const node = dialogRef.current;
      if (!node) return;
      const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusables.length === 0) {
        e.preventDefault();
        node.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, closeLocked]);

  if (!open || !mounted) return null;

  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeLocked) return;
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div className={styles.backdrop} onMouseDown={onBackdrop}>
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${styles[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={closeLocked}
            aria-label="닫기"
          >
            ×
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
