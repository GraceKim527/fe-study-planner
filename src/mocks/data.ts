import type { Course, StudyBlock } from "@/types";

export const courses: Course[] = [
  { id: "c-react",    title: "React 심화",         color: "#22C55E" },
  { id: "c-ts",       title: "TypeScript 실전",    color: "#3B82F6" },
  { id: "c-next",     title: "Next.js 16",         color: "#A855F7" },
  { id: "c-css",      title: "CSS 설계",           color: "#F59E0B" },
  { id: "c-test",     title: "테스트 코드 작성법", color: "#14B8A6" },
  { id: "c-algo",     title: "알고리즘 기초",      color: "#EC4899" },
  { id: "c-ds",       title: "자료구조",           color: "#EF4444" },
  { id: "c-network",  title: "네트워크 입문",      color: "#0EA5E9" },
  { id: "c-os",       title: "운영체제",           color: "#8B5CF6" },
  { id: "c-db",       title: "데이터베이스 기초",  color: "#10B981" },
  { id: "c-system",   title: "시스템 디자인",      color: "#F97316" },
  { id: "c-design",   title: "디자인 시스템",      color: "#06B6D4" },
  { id: "c-perf",     title: "프론트엔드 성능",    color: "#84CC16" },
  { id: "c-a11y",     title: "웹 접근성",          color: "#D946EF" },
  { id: "c-git",      title: "Git 활용",           color: "#6366F1" },
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
