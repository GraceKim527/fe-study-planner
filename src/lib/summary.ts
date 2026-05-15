import type { Course, DayOfWeek, StudyBlock } from "@/types";
import { timeToMinutes } from "./time";

export interface CourseSummary {
  course: Course;
  minutes: number;
}

export interface WeekSummary {
  totalMinutes: number;
  byCourse: CourseSummary[];
  byDay: Record<DayOfWeek, number>;
}

function blockMinutes(block: StudyBlock): number {
  return timeToMinutes(block.endTime) - timeToMinutes(block.startTime);
}

// courseId → 강의 메타. 모르는 courseId는 결과에서 제외해 잘못된 데이터로 화면이 깨지지 않게 한다.
export function summarizeWeek(
  blocks: StudyBlock[],
  courses: Course[],
): WeekSummary {
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const byDay: Record<DayOfWeek, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const courseMinutes = new Map<string, number>();
  let totalMinutes = 0;

  for (const block of blocks) {
    if (!courseMap.has(block.courseId)) continue;
    const minutes = blockMinutes(block);
    if (minutes <= 0) continue;

    totalMinutes += minutes;
    byDay[block.dayOfWeek] += minutes;
    courseMinutes.set(block.courseId, (courseMinutes.get(block.courseId) ?? 0) + minutes);
  }

  const byCourse: CourseSummary[] = [...courseMinutes.entries()]
    .map(([courseId, minutes]) => ({ course: courseMap.get(courseId)!, minutes }))
    .sort((a, b) => b.minutes - a.minutes || a.course.title.localeCompare(b.course.title, "ko"));

  return { totalMinutes, byCourse, byDay };
}
