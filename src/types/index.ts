// API 스키마: docs/assignment/api-schema.md

export interface Course {
  id: string;
  title: string;
  color: string;
}

// 0(월) ~ 6(일). Date.getDay()는 0(일) 기준이라 변환 필요.
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// "HH:mm", 30분 단위
export type TimeString = string;

export interface StudyBlock {
  id: string;
  courseId: string;
  dayOfWeek: DayOfWeek;
  startTime: TimeString;
  endTime: TimeString;
  memo?: string;
}

// 신규 블록은 임시 id로 다루고 저장 시 id를 빼고 보냄
export interface EditableStudyBlock extends StudyBlock {
  isNew?: boolean;
}

export interface CourseListResponse {
  courses: Course[];
}

export interface PlannerResponse {
  weekStart: string;
  blocks: StudyBlock[];
}

export interface SavePlannerRequestBlock {
  id?: string;
  courseId: string;
  dayOfWeek: DayOfWeek;
  startTime: TimeString;
  endTime: TimeString;
  memo?: string;
}

export interface SavePlannerRequest {
  weekStart: string;
  blocks: SavePlannerRequestBlock[];
}

export interface SavePlannerResponse {
  weekStart: string;
  blocks: StudyBlock[];
}

export type ApiErrorCode =
  | "TIME_CONFLICT"
  | "INVALID_TIME_RANGE"
  | "INVALID_BLOCK";

export interface ErrorResponse {
  code: ApiErrorCode;
  message: string;
}
