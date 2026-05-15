"use client";

import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import type { Course, DayOfWeek, StudyBlock, TimeString } from "@/types";
import { findConflictingIds } from "@/lib/conflict";
import { generateTimeSlots, minutesToTime, timeToMinutes } from "@/lib/time";
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
  // 빈 슬롯 클릭 — 클릭한 y를 30분 단위로 스냅한 시작 시각을 넘긴다.
  onSlotClick?: (day: DayOfWeek, startTime: TimeString) => void;
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
  onSlotClick,
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
  const dayEndMinutes = endHour * 60;
  const pxPerMinute = SLOT_HEIGHT_PX / SLOT_MINUTES;

  // 빈 슬롯 클릭: y 좌표 → 30분 단위로 스냅한 시작 시각.
  // 슬롯 위 padding(slot/2) 만큼 빼고 환산. 종료가 endHour를 넘지 않도록 마지막 슬롯은 제외.
  function handleDayClick(day: DayOfWeek, e: MouseEvent<HTMLDivElement>) {
    if (!onSlotClick) return;
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top - SLOT_HEIGHT_PX / 2;
    if (y < 0) return;
    const rawMin = y / pxPerMinute;
    const snapped = Math.floor(rawMin / SLOT_MINUTES) * SLOT_MINUTES;
    const startMin = dayStartMinutes + snapped;
    if (startMin + SLOT_MINUTES > dayEndMinutes) return;
    onSlotClick(day, minutesToTime(startMin));
  }

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
              className={`${styles.dayColumn} ${onSlotClick ? styles.dayColumnClickable : ""}`}
              role="group"
              aria-label={`${DAY_LABELS[dayIndex]}요일`}
              onClick={(e) => handleDayClick(day, e)}
              title={onSlotClick ? "빈 슬롯을 클릭해 새 블록 추가" : undefined}
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
