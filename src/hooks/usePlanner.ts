import { useQuery } from "@tanstack/react-query";
import { fetchPlanner } from "@/api/planner";
import { queryKeys } from "@/api/queryKeys";

export function usePlanner(weekStart: string) {
  return useQuery({
    queryKey: queryKeys.planner(weekStart),
    queryFn: ({ signal }) => fetchPlanner(weekStart, signal),
    enabled: weekStart.length > 0,
  });
}
