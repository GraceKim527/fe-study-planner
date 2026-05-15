"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { Course, DayOfWeek, StudyBlock } from "@/types";
import { findConflictingIds } from "@/lib/conflict";
import { generateTimeSlots, timeToMinutes } from "@/lib/time";
import { BlockCard } from "./BlockCard";
import styles from "./WeekGrid.module.css";

interface Props {
  blocks: StudyBlock[];
  courses: Course[];
  weekStart: Date;
  startHour?: number;
  endHour?: number;
  todayDayOfWeek?: DayOfWeek | null;
  onBlockClick?: (block: StudyBlock) => void;
}

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;
const SLOT_MINUTES = 30;
// tokens.css의 --grid-slot-height와 동기화 필요.
const SLOT_HEIGHT_PX = 40;

export function WeekGrid({
  blocks,
  courses,
  weekStart,
  startHour = 8,
  endHour = 22,
  todayDayOfWeek = null,
  onBlockClick,
}: Props) {
  const dayDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d.getDate();
      }),
    [weekStart],
  );
  const slots = useMemo(
    () => generateTimeSlots(startHour, endHour, SLOT_MINUTES).slice(0, -1),
    [startHour, endHour],
  );
  const hourLabels = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => `${String(startHour + i).padStart(2, "0")}:00`),
    [startHour, endHour],
  );
  const dayStartMinutes = startHour * 60;
  const pxPerMinute = SLOT_HEIGHT_PX / SLOT_MINUTES;

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  const conflictingIds = useMemo(() => findConflictingIds(blocks), [blocks]);
  const blocksByDay = useMemo(() => {
    const map = new Map<DayOfWeek, StudyBlock[]>();
    for (const b of blocks) {
      const list = map.get(b.dayOfWeek) ?? [];
      list.push(b);
      map.set(b.dayOfWeek, list);
    }
    return map;
  }, [blocks]);

  const gridStyle: CSSProperties = { ["--rows" as string]: slots.length };

  // 현재 시각 라인. SSR 시 mismatch 방지를 위해 마운트 전엔 null.
  const [now, setNow] = useState<Date | null>(() =>
    typeof window === "undefined" ? null : new Date(),
  );
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const dayEndMinutes = endHour * 60;
  const nowMinutes = now ? now.getHours() * 60 + now.getMinutes() : null;
  const showNow =
    nowMinutes !== null &&
    todayDayOfWeek !== null &&
    nowMinutes >= dayStartMinutes &&
    nowMinutes <= dayEndMinutes;
  const nowTop = showNow
    ? (nowMinutes - dayStartMinutes) * pxPerMinute + SLOT_HEIGHT_PX / 2
    : 0;
  const nowLabel = now
    ? `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    : "";

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerSpacer} aria-hidden />
        {DAY_LABELS.map((label, i) => (
          <div key={label} className={styles.headerCell}>
            <span
              className={`${styles.dayPill} ${todayDayOfWeek === i ? styles.dayPillToday : ""}`}
              aria-current={todayDayOfWeek === i ? "date" : undefined}
            >
              <span className={styles.dayLabel}>{label}</span>
              <span className={styles.dayDate}>{dayDates[i]}</span>
            </span>
          </div>
        ))}
      </div>

      <div className={styles.body} style={gridStyle}>
        <div className={styles.timeColumn} aria-hidden>
          {hourLabels.map((label, i) => (
            <div
              key={label}
              className={styles.timeLabel}
              style={{ ["--hour-index" as string]: i }}
            >
              {label}
            </div>
          ))}
        </div>

        {showNow && (
          <div
            className={styles.nowLine}
            style={{ ["--now-top" as string]: `${nowTop}px` }}
            aria-hidden
          >
            <div className={styles.nowDot} />
            <div className={styles.nowBadge}>{nowLabel}</div>
          </div>
        )}

        {DAY_LABELS.map((_, dayIndex) => {
          const day = dayIndex as DayOfWeek;
          const dayBlocks = blocksByDay.get(day) ?? [];
          return (
            <div
              key={dayIndex}
              className={styles.dayColumn}
              role="group"
              aria-label={`${DAY_LABELS[dayIndex]}요일`}
            >
              {hourLabels.map((label, i) => (
                <div
                  key={`line-${label}`}
                  className={styles.hourLine}
                  style={{ ["--hour-index" as string]: i }}
                  aria-hidden
                />
              ))}
              <div className={styles.blockLayer}>
                {dayBlocks.map((block) => {
                  const course = courseMap.get(block.courseId);
                  if (!course) return null;
                  const start = timeToMinutes(block.startTime);
                  if (start < dayStartMinutes) return null;
                  return (
                    <BlockCard
                      key={block.id}
                      block={block}
                      course={course}
                      conflict={conflictingIds.has(block.id)}
                      pxPerMinute={pxPerMinute}
                      dayStartMinutes={dayStartMinutes}
                      onClick={onBlockClick}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
