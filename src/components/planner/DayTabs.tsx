"use client";

import type { DayOfWeek } from "@/types";
import styles from "./DayTabs.module.css";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

interface Props {
  selected: DayOfWeek;
  todayDayOfWeek?: DayOfWeek | null;
  dayDates: number[];
  onChange(day: DayOfWeek): void;
  className?: string;
}

// 모바일 일별 뷰 전환용 요일 탭. CSS로 모바일에서만 노출.
export function DayTabs({ selected, todayDayOfWeek = null, dayDates, onChange, className }: Props) {
  return (
    <div
      className={`${styles.tabs} ${className ?? ""}`}
      role="tablist"
      aria-label="요일 선택"
    >
      {DAY_LABELS.map((label, i) => {
        const day = i as DayOfWeek;
        const isSelected = selected === day;
        const isToday = todayDayOfWeek === day;
        return (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={isSelected}
            className={`${styles.tab} ${isSelected ? styles.selected : ""} ${isToday ? styles.today : ""}`}
            onClick={() => onChange(day)}
          >
            <span className={styles.label}>{label}</span>
            <span className={styles.date}>{dayDates[i]}</span>
          </button>
        );
      })}
    </div>
  );
}
