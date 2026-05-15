import type {
  PlannerResponse,
  SavePlannerRequest,
  SavePlannerResponse,
} from "@/types";
import { request } from "./client";
import { plannerResponseSchema, savePlannerResponseSchema } from "./schemas";

export function fetchPlanner(
  weekStart: string,
  signal?: AbortSignal,
): Promise<PlannerResponse> {
  const url = `/api/planner?weekStart=${encodeURIComponent(weekStart)}`;
  return request(url, { schema: plannerResponseSchema, signal });
}

export function savePlanner(
  payload: SavePlannerRequest,
): Promise<SavePlannerResponse> {
  return request("/api/planner", {
    method: "PUT",
    body: payload,
    schema: savePlannerResponseSchema,
  });
}
