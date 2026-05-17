"use client";

import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import type { Course, DayOfWeek, StudyBlock, TimeString } from "@/types";
import { findConflictingIds } from "@/lib/conflict";
import { DAY_LABELS } from "@/lib/day";
import { generateTimeSlots, minutesToTime, timeToMinutes } from "@/lib/time";
import { BlockCard } from "./BlockCard";
import styles from "./WeekGrid.module.css";

const PREVIEW_MINUTES = 60;

interface Props {
  blocks: StudyBlock[];
  courses: Course[];
  weekStart: Date;
  startHour?: number;
  endHour?: number;
  todayDayOfWeek?: DayOfWeek | null;
  onBlockClick?: (block: StudyBlock) => void;
  onSlotClick?: (day: DayOfWeek, startTime: TimeString) => void;
}

const SLOT_MINUTES = 30;
// tokens.css의 --grid-slot-height와 동기화 필요.
const SLOT_HEIGHT_PX = 40;

export function WeekGrid({
  blocks,
  courses,
  weekStart,
  startHour = 8,
  endHour = 20,
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
  // endHour:00까지 포함 — 그리드 하단 slot/2 여유에 들어맞음.
  const hourLabels = useMemo(
    () => Array.from({ length: endHour - startHour + 1 }, (_, i) => `${String(startHour + i).padStart(2, "0")}:00`),
    [startHour, endHour],
  );
  const dayStartMinutes = startHour * 60;
  const dayEndMinutes = endHour * 60;
  const pxPerMinute = SLOT_HEIGHT_PX / SLOT_MINUTES;

  // 슬롯 위 padding(slot/2) 만큼 빼고 30분 스냅. 클릭/preview 모두 이걸 거쳐 위치가 어긋나지 않음.
  function snapToStartMin(rect: DOMRect, clientY: number): number | null {
    const y = clientY - rect.top - SLOT_HEIGHT_PX / 2;
    if (y < 0) return null;
    const rawMin = y / pxPerMinute;
    const snapped = Math.floor(rawMin / SLOT_MINUTES) * SLOT_MINUTES;
    return dayStartMinutes + snapped;
  }

  function handleDayClick(day: DayOfWeek, e: MouseEvent<HTMLDivElement>) {
    if (!onSlotClick) return;
    if (e.target !== e.currentTarget) return;
    const startMin = snapToStartMin(e.currentTarget.getBoundingClientRect(), e.clientY);
    if (startMin === null) return;
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

  // 기존 블록 위에선 e.target이 dayColumn이 아니라 자동으로 숨김.
  const [preview, setPreview] = useState<{ day: DayOfWeek; topPx: number; heightPx: number } | null>(null);

  function handleDayMouseMove(day: DayOfWeek, e: MouseEvent<HTMLDivElement>) {
    if (!onSlotClick) return;
    if (e.target !== e.currentTarget) {
      if (preview) setPreview(null);
      return;
    }
    const startMin = snapToStartMin(e.currentTarget.getBoundingClientRect(), e.clientY);
    if (startMin === null) {
      if (preview) setPreview(null);
      return;
    }
    if (startMin + PREVIEW_MINUTES > dayEndMinutes) {
      if (preview) setPreview(null);
      return;
    }
    const topPx = (startMin - dayStartMinutes) * pxPerMinute + SLOT_HEIGHT_PX / 2;
    const heightPx = PREVIEW_MINUTES * pxPerMinute;
    if (preview && preview.day === day && preview.topPx === topPx) return;
    setPreview({ day, topPx, heightPx });
  }

  function handleDayMouseLeave() {
    if (preview) setPreview(null);
  }

  // SSR hydration mismatch 방지.
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
          <div key={label} className={styles.headerCell} data-day={i}>
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
              data-day={dayIndex}
              role="group"
              aria-label={`${DAY_LABELS[dayIndex]}요일`}
              onClick={(e) => handleDayClick(day, e)}
              onMouseMove={(e) => handleDayMouseMove(day, e)}
              onMouseLeave={handleDayMouseLeave}
              title={onSlotClick ? "빈 슬롯을 클릭해 새 블록 추가" : undefined}
            >
              {hourLabels.slice(0, -1).map((label, i) => (
                <div
                  key={`line-${label}`}
                  className={styles.hourLine}
                  style={{ ["--hour-index" as string]: i }}
                  aria-hidden
                />
              ))}
              {preview && preview.day === day && (
                <div
                  className={styles.slotPreview}
                  style={{ top: preview.topPx, height: preview.heightPx }}
                  aria-hidden
                />
              )}
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
