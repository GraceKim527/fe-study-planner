"use client";

import { useRouter } from "next/navigation";
import { addWeeks, formatDateKey, formatWeekRange, getWeekStart } from "@/lib/time";
import { countChanges, usePlannerStore } from "@/stores/plannerStore";
import styles from "./WeekNav.module.css";

interface Props {
  weekStart: string;
  weekStartDate: Date;
  isThisWeek: boolean;
}

const LEAVE_CONFIRM = "저장하지 않은 변경사항이 있습니다. 이동하시겠습니까?";

export function WeekNav({ weekStart, weekStartDate, isThisWeek }: Props) {
  const router = useRouter();
  const dirty = usePlannerStore((s) => countChanges(s) > 0);

  function go(targetWeekStart: string) {
    if (targetWeekStart === weekStart) return;
    if (dirty && !window.confirm(LEAVE_CONFIRM)) return;
    router.push(`/?weekStart=${targetWeekStart}`);
  }

  const prev = formatDateKey(addWeeks(weekStartDate, -1));
  const next = formatDateKey(addWeeks(weekStartDate, 1));
  const today = formatDateKey(getWeekStart(new Date()));

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>주간 학습 플래너</h1>
      <div className={styles.navRow}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => go(prev)}
          aria-label="이전 주"
        >
          ‹
        </button>
        <p className={styles.range} aria-live="polite">
          {formatWeekRange(weekStartDate)}
        </p>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => go(next)}
          aria-label="다음 주"
        >
          ›
        </button>
        <button
          type="button"
          className={styles.todayBtn}
          onClick={() => go(today)}
          disabled={isThisWeek}
          aria-label="오늘로"
        >
          오늘
        </button>
      </div>
    </header>
  );
}
