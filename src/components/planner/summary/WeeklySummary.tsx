"use client";

import { useMemo, type CSSProperties } from "react";
import type { Course, DayOfWeek, StudyBlock } from "@/types";
import { summarizeWeek } from "@/lib/summary";
import { DAY_LABELS } from "@/lib/day";
import { formatDuration } from "@/lib/time";
import styles from "./WeeklySummary.module.css";

interface Props {
  blocks: StudyBlock[];
  courses: Course[];
}

export function WeeklySummary({ blocks, courses }: Props) {
  const summary = useMemo(() => summarizeWeek(blocks, courses), [blocks, courses]);
  // summarizeWeek와 동일한 기준(알 수 없는 강의 제외).
  const blockCount = useMemo(
    () => blocks.filter((b) => courses.some((c) => c.id === b.courseId)).length,
    [blocks, courses],
  );

  const maxCourseMinutes = summary.byCourse[0]?.minutes ?? 0;
  const maxDayMinutes = Math.max(...Object.values(summary.byDay), 0);
  const isEmpty = summary.totalMinutes === 0;

  return (
    <section className={styles.wrapper} aria-label="주간 학습 요약">
      <div className={styles.totalCard}>
        <span className={styles.totalLabel}>이번 주 총 학습 시간</span>
        <div className={styles.totalBody}>
          <strong className={styles.totalValue}>{formatDuration(summary.totalMinutes)}</strong>
          {!isEmpty && (
            <span className={styles.totalMeta}>
              블록 {blockCount}개 · 강의 {summary.byCourse.length}개
            </span>
          )}
        </div>
      </div>

      {isEmpty ? (
        <div className={styles.emptyCard}>
          <p className={styles.empty}>학습 블록을 추가하면 요약이 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className={styles.charts}>
          <div className={styles.chartCard} aria-label="강의별 학습 시간">
            <h3 className={styles.chartTitle}>강의별</h3>
            <ul className={styles.courseList}>
              {summary.byCourse.map(({ course, minutes }) => {
                const widthPct = maxCourseMinutes === 0 ? 0 : (minutes / maxCourseMinutes) * 100;
                const sharePct = Math.round((minutes / summary.totalMinutes) * 100);
                return (
                  <li key={course.id} className={styles.courseRow}>
                    <span className={styles.courseTitle} title={course.title}>
                      {course.title}
                    </span>
                    <div
                      className={styles.barTrack}
                      role="progressbar"
                      aria-valuenow={minutes}
                      aria-valuemin={0}
                      aria-valuemax={summary.totalMinutes}
                      aria-label={`${course.title} ${formatDuration(minutes)}, 전체의 ${sharePct}%`}
                    >
                      <span
                        className={styles.barFill}
                        style={{ width: `${widthPct}%`, background: course.color } as CSSProperties}
                      />
                    </div>
                    <span className={styles.courseValue}>{formatDuration(minutes)}</span>
                    <span className={styles.coursePct}>{sharePct}%</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.chartCard} aria-label="요일별 학습 시간">
            <h3 className={styles.chartTitle}>요일별</h3>
            <ol className={styles.dayChart}>
              {DAY_LABELS.map((label, i) => {
                const day = i as DayOfWeek;
                const minutes = summary.byDay[day];
                const heightPct = maxDayMinutes === 0 ? 0 : (minutes / maxDayMinutes) * 100;
                return (
                  <li key={day} className={styles.dayItem}>
                    <div
                      className={styles.dayBarTrack}
                      role="progressbar"
                      aria-valuenow={minutes}
                      aria-valuemin={0}
                      aria-valuemax={maxDayMinutes || 1}
                      aria-label={`${label}요일 ${formatDuration(minutes)}`}
                    >
                      <span
                        className={styles.dayBarFill}
                        style={{ height: `${heightPct}%` } as CSSProperties}
                      />
                    </div>
                    <span className={styles.dayLabel}>{label}</span>
                    <span className={styles.dayValue}>
                      {minutes > 0 ? formatDuration(minutes) : "—"}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}
