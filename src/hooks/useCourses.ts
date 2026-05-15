import { useQuery } from "@tanstack/react-query";
import { fetchCourses } from "@/api/courses";
import { queryKeys } from "@/api/queryKeys";

export function useCourses() {
  return useQuery({
    queryKey: queryKeys.courses,
    queryFn: ({ signal }) => fetchCourses(signal),
    staleTime: Infinity, // 강의 목록은 한 세션에서 변하지 않는다.
  });
}
