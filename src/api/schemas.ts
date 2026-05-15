import { z } from "zod";
import type { DayOfWeek } from "@/types";

// 서버 응답을 런타임에 한 번 검증한다 — TS 타입만 믿지 않기.
// 실패 시 ApiError("INVALID_RESPONSE")로 변환.

export const courseSchema = z.object({
  id: z.string(),
  title: z.string(),
  color: z.string(),
});

export const dayOfWeekSchema = z
  .number()
  .int()
  .min(0)
  .max(6)
  .transform((n) => n as DayOfWeek);

const timeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "HH:mm 형식이 아닙니다.");

export const studyBlockSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  dayOfWeek: dayOfWeekSchema,
  startTime: timeStringSchema,
  endTime: timeStringSchema,
  memo: z.string().optional(),
});

export const courseListResponseSchema = z.object({
  courses: z.array(courseSchema),
});

export const plannerResponseSchema = z.object({
  weekStart: z.string(),
  blocks: z.array(studyBlockSchema),
});

export const savePlannerResponseSchema = plannerResponseSchema;

// 에러 코드는 명시된 셋 + 미상값 허용 (서버가 새 코드를 추가했을 때 깨지지 않게).
export const errorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
});
