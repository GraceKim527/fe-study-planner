import type { CSSProperties } from "react";
import type { DayOfWeek } from "@/types";
import { DAY_LABELS } from "@/lib/day";
import { generateTimeSlots } from "@/lib/time";
import gridStyles from "./WeekGrid.module.css";
import styles from "./WeekGridSkeleton.module.css";

interface Props {
  startHour?: number;
  endHour?: number;
}

const SLOT_HEIGHT_PX = 40;
const SLOT_MINUTES = 30;
const PX_PER_MINUTE = SLOT_HEIGHT_PX / SLOT_MINUTES;

const FAKE_BLOCKS: Array<{ day: DayOfWeek; startMin: number; durationMin: number }> = [
  { day: 0, startMin: 9 * 60, durationMin: 90 },
  { day: 1, startMin: 11 * 60, durationMin: 60 },
  { day: 2, startMin: 14 * 60, durationMin: 120 },
  { day: 3, startMin: 10 * 60, durationMin: 60 },
  { day: 4, startMin: 9 * 60 + 30, durationMin: 90 },
  { day: 5, startMin: 13 * 60, durationMin: 60 },
];

export function WeekGridSkeleton({ startHour = 8, endHour = 20 }: Props) {
  const slots = generateTimeSlots(startHour, endHour, SLOT_MINUTES).slice(0, -1);
  const hourLabels = Array.from(
    { length: endHour - startHour },
    (_, i) => `${String(startHour + i).padStart(2, "0")}:00`,
  );
  const bodyStyle: CSSProperties = { ["--rows" as string]: slots.length };
  const dayStartMinutes = startHour * 60;

  return (
    <div
      className={gridStyles.wrapper}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="플래너를 불러오는 중"
    >
      <div className={gridStyles.header}>
        <div className={gridStyles.headerSpacer} aria-hidden />
        {DAY_LABELS.map((label) => (
          <div key={label} className={gridStyles.headerCell}>
            <span className={gridStyles.dayPill} aria-hidden>
              <span className={`${styles.bar} ${styles.barLabel}`} />
              <span className={`${styles.bar} ${styles.barDate}`} />
            </span>
          </div>
        ))}
      </div>

      <div className={gridStyles.body} style={bodyStyle}>
        <div className={gridStyles.timeColumn} aria-hidden>
          {hourLabels.map((label, i) => (
            <div
              key={label}
              className={gridStyles.timeLabel}
              style={{ ["--hour-index" as string]: i }}
            >
              <span className={`${styles.bar} ${styles.barTime}`} />
            </div>
          ))}
        </div>

        {DAY_LABELS.map((_, dayIndex) => {
          const day = dayIndex as DayOfWeek;
          const dayBlocks = FAKE_BLOCKS.filter((b) => b.day === day);
          return (
            <div key={dayIndex} className={gridStyles.dayColumn} aria-hidden>
              {hourLabels.map((label, i) => (
                <div
                  key={`line-${label}`}
                  className={gridStyles.hourLine}
                  style={{ ["--hour-index" as string]: i }}
                />
              ))}
              <div className={gridStyles.blockLayer}>
                {dayBlocks.map((b, i) => {
                  const top = (b.startMin - dayStartMinutes) * PX_PER_MINUTE;
                  const height = b.durationMin * PX_PER_MINUTE;
                  return (
                    <div
                      key={i}
                      className={styles.fakeCard}
                      style={{ top, height }}
                    >
                      <span className={`${styles.bar} ${styles.barTitle}`} />
                      <span className={`${styles.bar} ${styles.barRange}`} />
                    </div>
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
