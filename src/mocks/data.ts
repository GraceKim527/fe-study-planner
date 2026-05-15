import type { Course, StudyBlock } from "@/types";

export const courses: Course[] = [
  { id: "c-react",    title: "React 심화",      color: "#22C55E" },
  { id: "c-ts",       title: "TypeScript 실전", color: "#3B82F6" },
  { id: "c-next",     title: "Next.js 16",      color: "#A855F7" },
  { id: "c-css",      title: "CSS 설계",        color: "#F59E0B" },
  { id: "c-test",     title: "테스트 코드",     color: "#14B8A6" },
  { id: "c-algo",     title: "알고리즘",        color: "#EC4899" },
];

// 이번 주 샘플 블록 (weekStart는 핸들러에서 동적으로 매칭).
// 실제로는 weekStart별로 Map에 보관 — store.ts 참고.
export const initialBlocks: StudyBlock[] = [
  { id: "b-1", courseId: "c-react", dayOfWeek: 0, startTime: "09:00", endTime: "10:30" },
  { id: "b-2", courseId: "c-ts",    dayOfWeek: 0, startTime: "11:00", endTime: "12:00", memo: "제네릭 복습" },
  { id: "b-3", courseId: "c-next",  dayOfWeek: 2, startTime: "14:00", endTime: "16:00" },
  { id: "b-4", courseId: "c-css",   dayOfWeek: 3, startTime: "10:00", endTime: "11:00" },
  { id: "b-5", courseId: "c-test",  dayOfWeek: 4, startTime: "09:00", endTime: "10:00" },
];
