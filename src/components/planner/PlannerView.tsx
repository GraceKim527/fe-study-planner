"use client";

import { useEffect, useMemo, useState } from "react";
import type { DayOfWeek, EditableStudyBlock, StudyBlock, TimeString } from "@/types";
import { WeekGrid } from "./WeekGrid";
import { WeekGridSkeleton } from "./WeekGridSkeleton";
import { WeeklySummary } from "./WeeklySummary";
import { WeeklySummarySkeleton } from "./WeeklySummarySkeleton";
import { SaveBar } from "./SaveBar";
import { DayTabs } from "./DayTabs";
import { BlockEditor, type BlockDraft } from "./BlockEditor";
import { PlannerError } from "./PlannerError";
import { Toast } from "@/components/ui/Toast";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";
import { useCourses } from "@/hooks/useCourses";
import { usePlanner } from "@/hooks/usePlanner";
import { useSavePlanner } from "@/hooks/useSavePlanner";
import { countChanges, toSaveRequestBlocks, usePlannerStore } from "@/stores/plannerStore";
import { ApiError } from "@/api/client";
import { findConflictingIds } from "@/lib/conflict";
import { minutesToTime, timeToMinutes } from "@/lib/time";

type CreatePreset = { dayOfWeek: DayOfWeek; startTime: TimeString; endTime: TimeString };

interface Props {
  weekStart: string;
  weekStartDate: Date;
  todayDayOfWeek: DayOfWeek | null;
}

type EditorState =
  | { kind: "closed" }
  | { kind: "create"; preset: CreatePreset | null }
  | { kind: "edit"; block: EditableStudyBlock };

export function PlannerView({ weekStart, weekStartDate, todayDayOfWeek }: Props) {
  const courses = useCourses();
  const planner = usePlanner(weekStart);
  const blocks = usePlannerStore((s) => s.blocks);
  const hydrate = usePlannerStore((s) => s.hydrate);
  const addBlock = usePlannerStore((s) => s.addBlock);
  const updateBlock = usePlannerStore((s) => s.updateBlock);
  const removeBlock = usePlannerStore((s) => s.removeBlock);
  const reset = usePlannerStore((s) => s.reset);
  const changeCount = usePlannerStore(countChanges);
  const dirty = changeCount > 0;
  // 같은 충돌 계산을 WeekGrid도 자체적으로 수행한다(시각 표시용). selector 일원화는 과한 추상화라 유지.
  const conflictCount = useMemo(() => findConflictingIds(blocks).size, [blocks]);

  const [editor, setEditor] = useState<EditorState>({ kind: "closed" });
  const [toastOpen, setToastOpen] = useState(false);
  // 모바일 일별 뷰에서 선택된 요일. 데스크톱에선 효과 없음(CSS).
  // 기본값: 오늘(이번 주일 때) 또는 월요일.
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayDayOfWeek ?? 0);
  const save = useSavePlanner({ onSuccess: () => setToastOpen(true) });

  // 미저장 변경이 있거나 저장 진행 중이면 새로고침/닫기 시 브라우저가 확인 다이얼로그를 띄움.
  useBeforeUnload(dirty || save.isPending);

  // 서버 응답이 들어오거나 weekStart가 바뀔 때마다 편집 스토어를 다시 채운다.
  useEffect(() => {
    if (planner.data) {
      hydrate(planner.data.weekStart, planner.data.blocks);
    }
  }, [planner.data, hydrate]);

  const dayDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStartDate);
        d.setDate(d.getDate() + i);
        return d.getDate();
      }),
    [weekStartDate],
  );

  function handleSubmit(draft: BlockDraft) {
    if (editor.kind === "create") {
      addBlock(draft);
    } else if (editor.kind === "edit") {
      updateBlock(editor.block.id, draft);
    }
    setEditor({ kind: "closed" });
  }

  function handleDelete() {
    if (editor.kind !== "edit") return;
    removeBlock(editor.block.id);
    setEditor({ kind: "closed" });
  }

  function handleSave() {
    if (!dirty || conflictCount > 0) return;
    save.save({ weekStart, blocks: toSaveRequestBlocks(blocks) });
  }

  const saveError = save.error instanceof ApiError ? save.error : undefined;

  const hasError = courses.isError || planner.isError;
  const isLoading = courses.isPending || planner.isPending;
  // courses/planner 둘 다 도착했고 에러도 없을 때만 실데이터 영역 노출.
  const ready = !isLoading && !hasError && courses.data && planner.data;

  // 모바일 일별 뷰에서 selectedDay 외 컬럼/헤더를 숨기는 CSS.
  // PlannerView 마커(data-planner-root) 안쪽으로 범위 제한.
  // SSR에서도 selectedDay 기본값을 알기 때문에 첫 페인트부터 정확 — 깜빡임 0.
  const mobileDayCss = `@media (max-width: 640px) { [data-planner-root] [data-day]:not([data-day="${selectedDay}"]) { display: none !important; } }`;

  return (
    // display:contents — 부모(.page)의 flex/gap을 자식들이 그대로 받게 한다.
    // data-planner-root는 동적 모바일 CSS의 selector 범위 제한용 마커.
    <div data-planner-root style={{ display: "contents" }}>
      <style>{mobileDayCss}</style>

      {ready ? (
        <WeeklySummary blocks={blocks} courses={courses.data.courses} />
      ) : (
        <WeeklySummarySkeleton />
      )}

      {ready && (
        <DayTabs
          selected={selectedDay}
          todayDayOfWeek={todayDayOfWeek}
          dayDates={dayDates}
          onChange={setSelectedDay}
        />
      )}

      {/* 변경사항이 있을 때만 하단에 floating으로 등장. */}
      {ready && dirty && (
        <SaveBar
          changeCount={changeCount}
          conflictCount={conflictCount}
          isSaving={save.isPending}
          errorKind={saveError?.kind}
          errorMessage={save.error?.message}
          onSave={handleSave}
          onReset={reset}
        />
      )}

      {hasError ? (
        <PlannerError
          message={courses.error?.message ?? planner.error?.message}
          onRetry={() => {
            if (courses.isError) courses.refetch();
            if (planner.isError) planner.refetch();
          }}
        />
      ) : ready ? (
        <WeekGrid
          blocks={blocks}
          courses={courses.data.courses}
          weekStart={weekStartDate}
          todayDayOfWeek={todayDayOfWeek}
          onBlockClick={(b: StudyBlock) => setEditor({ kind: "edit", block: b as EditableStudyBlock })}
          onSlotClick={(dayOfWeek, startTime) => {
            // 기본 길이 1시간. 그리드 끝을 넘는 경우는 WeekGrid에서 이미 거름.
            const endTime = minutesToTime(timeToMinutes(startTime) + 60);
            setEditor({ kind: "create", preset: { dayOfWeek, startTime, endTime } });
          }}
        />
      ) : (
        <WeekGridSkeleton />
      )}

      <Toast
        open={toastOpen}
        message="저장되었습니다"
        tone="success"
        onClose={() => setToastOpen(false)}
      />
      {editor.kind !== "closed" && (
        <BlockEditor
          // 다시 열거나 다른 블록을 편집할 때 폼을 초기화하기 위해 key로 리마운트.
          key={editor.kind === "edit" ? editor.block.id : `new:${editor.preset?.dayOfWeek ?? "x"}:${editor.preset?.startTime ?? "x"}`}
          open
          mode={editor.kind === "edit" ? "edit" : "create"}
          initial={editor.kind === "edit" ? editor.block : (editor.preset ?? undefined)}
          courses={courses.data?.courses ?? []}
          onSubmit={handleSubmit}
          onDelete={editor.kind === "edit" ? handleDelete : undefined}
          onClose={() => setEditor({ kind: "closed" })}
        />
      )}
    </div>
  );
}
