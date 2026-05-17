import type { CSSProperties } from "react";
import type { Course, StudyBlock } from "@/types";
import { formatTimeRange, timeToMinutes } from "@/lib/time";
import styles from "./BlockCard.module.css";

interface Props {
  block: StudyBlock;
  course: Course;
  conflict: boolean;
  // 그리드의 분당 픽셀(슬롯 높이/30). 부모가 계산해 넘김.
  pxPerMinute: number;
  dayStartMinutes: number;
  onClick?: (block: StudyBlock) => void;
}

export function BlockCard({ block, course, conflict, pxPerMinute, dayStartMinutes, onClick }: Props) {
  const start = timeToMinutes(block.startTime);
  const end = timeToMinutes(block.endTime);
  const top = (start - dayStartMinutes) * pxPerMinute;
  const height = (end - start) * pxPerMinute;

  const style: CSSProperties = {
    top,
    height,
    ["--block-color" as string]: course.color,
    /* 옅은 배경 — 색상 hex 끝에 alpha(1A ≈ 10%) 붙임. course.color는 #RRGGBB 6자리 가정. */
    ["--block-bg" as string]: `${course.color}1A`,
  };

  return (
    <button
      type="button"
      className={`${styles.card} ${conflict ? styles.conflict : ""}`}
      style={style}
      aria-label={`${course.title} ${formatTimeRange(block.startTime, block.endTime)}${conflict ? " (시간 충돌)" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(block);
      }}
    >
      <span className={styles.title}>{course.title}</span>
      <span className={styles.range}>{formatTimeRange(block.startTime, block.endTime)}</span>
    </button>
  );
}
