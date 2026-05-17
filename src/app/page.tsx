import { redirect } from "next/navigation";
import { PlannerView } from "@/components/planner/PlannerView";
import { WeekNav } from "@/components/planner/WeekNav";
import {
  formatDateKey,
  getWeekStart,
  parseDateKey,
  toDayOfWeek,
} from "@/lib/time";
import styles from "./page.module.css";

interface PageProps {
  searchParams: Promise<{ weekStart?: string | string[] }>;
}

export default async function Home({ searchParams }: PageProps) {
  const raw = (await searchParams).weekStart;
  const rawStr = Array.isArray(raw) ? raw[0] : raw;

  const now = new Date();
  const today = toDayOfWeek(now);
  const thisWeek = formatDateKey(getWeekStart(now));

  // 파라미터 없으면 이번 주로. 잘못된 날짜는 이번 주로 redirect (자가치유).
  if (!rawStr) {
    redirect(`/?weekStart=${thisWeek}`);
  }
  const parsed = parseDateKey(rawStr);
  if (!parsed) {
    redirect(`/?weekStart=${thisWeek}`);
  }
  // 월요일이 아니면 같은 주 월요일로 보정.
  const normalized = formatDateKey(getWeekStart(parsed));
  if (normalized !== rawStr) {
    redirect(`/?weekStart=${normalized}`);
  }

  const weekStartDate = getWeekStart(parsed);
  const weekStart = normalized;
  const isThisWeek = weekStart === thisWeek;

  return (
    <div className={styles.page}>
      <WeekNav
        weekStart={weekStart}
        weekStartDate={weekStartDate}
        isThisWeek={isThisWeek}
      />
      <PlannerView
        weekStart={weekStart}
        weekStartDate={weekStartDate}
        todayDayOfWeek={isThisWeek ? today : null}
      />
    </div>
  );
}
