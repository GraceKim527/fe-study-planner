import type { CourseListResponse } from "@/types";
import { request } from "./client";
import { courseListResponseSchema } from "./schemas";

export function fetchCourses(signal?: AbortSignal): Promise<CourseListResponse> {
  return request("/api/courses", {
    schema: courseListResponseSchema,
    signal,
  });
}
