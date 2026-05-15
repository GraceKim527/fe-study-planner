"use client";

import { useEffect } from "react";
import type { DayOfWeek } from "@/types";
import { WeekGrid } from "./WeekGrid";
import { WeekGridSkeleton } from "./WeekGridSkeleton";
import { useCourses } from "@/hooks/useCourses";
import { usePlanner } from "@/hooks/usePlanner";
import { usePlannerStore } from "@/stores/plannerStore";
import styles from "@/app/page.module.css";

interface Props {
  weekStart: string;
  weekStartDate: Date;
  todayDayOfWeek: DayOfWeek | null;
}

export function PlannerView({ weekStart, weekStartDate, todayDayOfWeek }: Props) {
  const courses = useCourses();
  const planner = usePlanner(weekStart);
  const blocks = usePlannerStore((s) => s.blocks);
  const hydrate = usePlannerStore((s) => s.hydrate);

  // 서버 응답이 들어오거나 weekStart가 바뀔 때마다 편집 스토어를 다시 채운다.
  useEffect(() => {
    if (planner.data) {
      hydrate(planner.data.weekStart, planner.data.blocks);
    }
  }, [planner.data, hydrate]);

  if (courses.isPending || planner.isPending) {
    return <WeekGridSkeleton />;
  }
  if (courses.isError || planner.isError) {
    const msg = courses.error?.message ?? planner.error?.message ?? "데이터를 불러오지 못했습니다.";
    return <div className={`${styles.status} ${styles.error}`}>{msg}</div>;
  }

  return (
    <WeekGrid
      blocks={blocks}
      courses={courses.data.courses}
      weekStart={weekStartDate}
      todayDayOfWeek={todayDayOfWeek}
    />
  );
}
