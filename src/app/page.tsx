import { PlannerView } from "@/components/planner/PlannerView";
import {
  formatDateKey,
  formatWeekRange,
  getWeekStart,
  toDayOfWeek,
} from "@/lib/time";
import styles from "./page.module.css";

export default function Home() {
  const now = new Date();
  const today = toDayOfWeek(now);
  const weekStartDate = getWeekStart(now);
  const weekStart = formatDateKey(weekStartDate);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>주간 학습 플래너</h1>
        <p>{formatWeekRange(weekStartDate)}</p>
      </header>
      <PlannerView
        weekStart={weekStart}
        weekStartDate={weekStartDate}
        todayDayOfWeek={today}
      />
    </div>
  );
}
