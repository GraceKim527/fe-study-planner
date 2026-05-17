"use client";

import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import type { Course, DayOfWeek, StudyBlock, TimeString } from "@/types";
import { findConflictingIds } from "@/lib/conflict";
import { generateTimeSlots, minutesToTime, timeToMinutes } from "@/lib/time";
import { BlockCard } from "./BlockCard";
import styles from "./WeekGrid.module.css";

// 빈 슬롯 hover preview의 기본 길이. handleSlotClick의 새 블록 기본값과 동기화.
const PREVIEW_MINUTES = 60;

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
  // 마지막 정시(endHour:00) 라벨까지 포함. 그리드 하단 slot/2 여유에 정확히 들어맞음.
  const hourLabels = useMemo(
    () => Array.from({ length: endHour - startHour + 1 }, (_, i) => `${String(startHour + i).padStart(2, "0")}:00`),
    [startHour, endHour],
  );
  const dayStartMinutes = startHour * 60;
  const dayEndMinutes = endHour * 60;
  const pxPerMinute = SLOT_HEIGHT_PX / SLOT_MINUTES;

  // y 좌표 → 30분 스냅된 시작 분. 슬롯 위 padding(slot/2) 만큼 빼고 환산.
  // 클릭/preview 둘 다 이걸 거쳐 결과가 한 칸 어긋나지 않게 한다.
  function snapToStartMin(rect: DOMRect, clientY: number): number | null {
    const y = clientY - rect.top - SLOT_HEIGHT_PX / 2;
    if (y < 0) return null;
    const rawMin = y / pxPerMinute;
    const snapped = Math.floor(rawMin / SLOT_MINUTES) * SLOT_MINUTES;
    return dayStartMinutes + snapped;
  }

  // 빈 슬롯 클릭: 종료가 endHour를 넘지 않도록 마지막 슬롯은 제외.
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

  // 빈 슬롯 hover preview — 마우스 따라다니는 흐릿한 1시간 블록.
  // 클릭과 동일한 30분 스냅 위치라 클릭 결과와 정확히 일치.
  // 기존 블록 위에선 BlockCard가 위에 있어서 e.target이 dayColumn이 아니므로 자동으로 숨겨진다.
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
              {/* 정시 점선은 라벨 사이 구분선이므로 마지막 정시(endHour:00) 위치엔 안 그림. */}
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
