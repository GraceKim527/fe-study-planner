import { useMutation, useQueryClient } from "@tanstack/react-query";
import { savePlanner } from "@/api/planner";
import { queryKeys } from "@/api/queryKeys";
import type { SavePlannerRequest, SavePlannerResponse } from "@/types";

export function useSavePlanner() {
  const qc = useQueryClient();
  return useMutation<SavePlannerResponse, Error, SavePlannerRequest>({
    mutationFn: (payload) => savePlanner(payload),
    onSuccess: (data) => {
      // 저장 성공 → 서버 응답으로 캐시를 직접 갱신.
      qc.setQueryData(queryKeys.planner(data.weekStart), data);
    },
  });
}
