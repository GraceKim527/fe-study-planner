import { useMutation, useQueryClient } from "@tanstack/react-query";
import { savePlanner } from "@/api/planner";
import { queryKeys } from "@/api/queryKeys";
import type { SavePlannerRequest, SavePlannerResponse } from "@/types";

interface UseSavePlannerOptions {
  onSuccess?(data: SavePlannerResponse): void;
}

export function useSavePlanner(options: UseSavePlannerOptions = {}) {
  const qc = useQueryClient();
  const mutation = useMutation<SavePlannerResponse, Error, SavePlannerRequest>({
    mutationFn: (payload) => savePlanner(payload),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.planner(data.weekStart), data);
      options.onSuccess?.(data);
    },
  });

  // 진행 중이면 무시 — UI disabled 우회·연타 방지.
  function save(payload: SavePlannerRequest) {
    if (mutation.isPending) return;
    mutation.mutate(payload);
  }

  return {
    save,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
