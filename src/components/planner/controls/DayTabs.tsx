"use client";

import { useRef, type KeyboardEvent } from "react";
import type { DayOfWeek } from "@/types";
import { DAY_LABELS } from "@/lib/day";
import styles from "./DayTabs.module.css";

interface Props {
  selected: DayOfWeek;
  todayDayOfWeek?: DayOfWeek | null;
  dayDates: number[];
  onChange(day: DayOfWeek): void;
  className?: string;
}

export function DayTabs({ selected, todayDayOfWeek = null, dayDates, onChange, className }: Props) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function moveTo(day: DayOfWeek) {
    onChange(day);
    tabRefs.current[day]?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, current: DayOfWeek) {
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        moveTo(((current + 6) % 7) as DayOfWeek);
        break;
      case "ArrowRight":
        e.preventDefault();
        moveTo(((current + 1) % 7) as DayOfWeek);
        break;
      case "Home":
        e.preventDefault();
        moveTo(0);
        break;
      case "End":
        e.preventDefault();
        moveTo(6);
        break;
    }
  }

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
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isSelected}
            // roving tabindex: 선택된 탭만 Tab 도달, 나머지는 화살표로만.
            tabIndex={isSelected ? 0 : -1}
            className={`${styles.tab} ${isSelected ? styles.selected : ""} ${isToday ? styles.today : ""}`}
            onClick={() => onChange(day)}
            onKeyDown={(e) => handleKeyDown(e, day)}
          >
            <span className={styles.label}>{label}</span>
            <span className={styles.date}>{dayDates[i]}</span>
          </button>
        );
      })}
    </div>
  );
}
