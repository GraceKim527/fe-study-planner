import summaryStyles from "./WeeklySummary.module.css";
import styles from "./WeeklySummarySkeleton.module.css";

// 실데이터 카드와 동일한 골격을 회색으로. 데이터 도착 시 점프 없음.
const FAKE_COURSE_WIDTHS = [82, 64, 46, 30, 18];
const FAKE_DAY_HEIGHTS = [60, 80, 45, 70, 55, 25, 35];

export function WeeklySummarySkeleton() {
  return (
    <section
      className={summaryStyles.wrapper}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="주간 요약을 불러오는 중"
    >
      <div className={summaryStyles.totalCard} aria-hidden>
        <span className={`${styles.bar} ${styles.totalLabel}`} />
        <div className={summaryStyles.totalBody}>
          <span className={`${styles.bar} ${styles.totalValue}`} />
          <span className={`${styles.bar} ${styles.totalMeta}`} />
        </div>
      </div>

      <div className={summaryStyles.charts} aria-hidden>
        <div className={summaryStyles.chartCard}>
          <span className={`${styles.bar} ${styles.chartTitle}`} />
          <ul className={summaryStyles.courseList}>
            {FAKE_COURSE_WIDTHS.map((widthPct, i) => (
              <li key={i} className={summaryStyles.courseRow}>
                <span className={`${styles.bar} ${styles.courseTitle}`} />
                <div className={summaryStyles.barTrack}>
                  <span
                    className={`${summaryStyles.barFill} ${styles.barFillSkeleton}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className={`${styles.bar} ${styles.courseValue}`} />
                <span className={`${styles.bar} ${styles.coursePct}`} />
              </li>
            ))}
          </ul>
        </div>

        <div className={summaryStyles.chartCard}>
          <span className={`${styles.bar} ${styles.chartTitle}`} />
          <ol className={summaryStyles.dayChart}>
            {FAKE_DAY_HEIGHTS.map((heightPct, i) => (
              <li key={i} className={summaryStyles.dayItem}>
                <div className={summaryStyles.dayBarTrack}>
                  <span
                    className={`${summaryStyles.dayBarFill} ${styles.dayBarFillSkeleton}`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className={`${styles.bar} ${styles.dayLabel}`} />
                <span className={`${styles.bar} ${styles.dayValue}`} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
