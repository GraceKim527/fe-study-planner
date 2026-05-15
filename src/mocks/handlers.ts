import { http, HttpResponse } from "msw";
import type {
  CourseListResponse,
  ErrorResponse,
  PlannerResponse,
  SavePlannerRequest,
  SavePlannerResponse,
  StudyBlock,
} from "@/types";
import { hasAnyConflict } from "@/lib/conflict";
import { timeToMinutes } from "@/lib/time";
import { courses } from "./data";
import { getBlocks, setBlocks } from "./store";

const LATENCY_MS = 300;
const delay = () => new Promise((r) => setTimeout(r, LATENCY_MS));

export const handlers = [
  http.get("/api/courses", async () => {
    await delay();
    const body: CourseListResponse = { courses };
    return HttpResponse.json(body);
  }),

  http.get("/api/planner", async ({ request }) => {
    await delay();
    const url = new URL(request.url);
    const weekStart = url.searchParams.get("weekStart") ?? "";
    const body: PlannerResponse = {
      weekStart,
      blocks: getBlocks(weekStart),
    };
    return HttpResponse.json(body);
  }),

  http.put("/api/planner", async ({ request }) => {
    await delay();
    const payload = (await request.json()) as SavePlannerRequest;

    // 1) 시간 범위 검증
    for (const b of payload.blocks) {
      if (timeToMinutes(b.startTime) >= timeToMinutes(b.endTime)) {
        const err: ErrorResponse = {
          code: "INVALID_TIME_RANGE",
          message: "종료 시간이 시작 시간보다 빠릅니다.",
        };
        return HttpResponse.json(err, { status: 400 });
      }
    }

    // 2) id 발급 후 충돌 검사
    const finalized: StudyBlock[] = payload.blocks.map((b, i) => ({
      id: b.id ?? `srv-${Date.now()}-${i}`,
      courseId: b.courseId,
      dayOfWeek: b.dayOfWeek,
      startTime: b.startTime,
      endTime: b.endTime,
      memo: b.memo,
    }));

    if (hasAnyConflict(finalized)) {
      const err: ErrorResponse = {
        code: "TIME_CONFLICT",
        message: "겹치는 학습 블록이 있습니다.",
      };
      return HttpResponse.json(err, { status: 409 });
    }

    setBlocks(payload.weekStart, finalized);
    const body: SavePlannerResponse = {
      weekStart: payload.weekStart,
      blocks: finalized,
    };
    return HttpResponse.json(body);
  }),
];
