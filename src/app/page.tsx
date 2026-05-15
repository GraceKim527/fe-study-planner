import { WeekGrid } from "@/components/planner/WeekGrid";
import { courses, initialBlocks } from "@/mocks/data";
import { formatWeekRange, getWeekStart, toDayOfWeek } from "@/lib/time";
import styles from "./page.module.css";

export default function Home() {
  const now = new Date();
  const today = toDayOfWeek(now);
  const weekStart = getWeekStart(now);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>주간 학습 플래너</h1>
        <p>{formatWeekRange(weekStart)}</p>
      </header>
      <WeekGrid
        blocks={initialBlocks}
        courses={courses}
        weekStart={weekStart}
        todayDayOfWeek={today}
      />
    </div>
  );
}
