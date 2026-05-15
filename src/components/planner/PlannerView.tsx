"use client";

import { useEffect, useState } from "react";
import type { DayOfWeek, EditableStudyBlock, StudyBlock, TimeString } from "@/types";
import { WeekGrid } from "./WeekGrid";
import { WeekGridSkeleton } from "./WeekGridSkeleton";
import { BlockEditor, type BlockDraft } from "./BlockEditor";
import { PlannerError } from "./PlannerError";
import { useCourses } from "@/hooks/useCourses";
import { usePlanner } from "@/hooks/usePlanner";
import { usePlannerStore } from "@/stores/plannerStore";
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

  const [editor, setEditor] = useState<EditorState>({ kind: "closed" });

  // 서버 응답이 들어오거나 weekStart가 바뀔 때마다 편집 스토어를 다시 채운다.
  useEffect(() => {
    if (planner.data) {
      hydrate(planner.data.weekStart, planner.data.blocks);
    }
  }, [planner.data, hydrate]);

  if (courses.isPending || planner.isPending) {
    return <WeekGridSkeleton />;
  }
  if (courses.isError || planner.isError) {
    return (
      <PlannerError
        message={courses.error?.message ?? planner.error?.message}
        onRetry={() => {
          if (courses.isError) courses.refetch();
          if (planner.isError) planner.refetch();
        }}
      />
    );
  }

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

  return (
    <>
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
      {editor.kind !== "closed" && (
        <BlockEditor
          // 다시 열거나 다른 블록을 편집할 때 폼을 초기화하기 위해 key로 리마운트.
          key={editor.kind === "edit" ? editor.block.id : `new:${editor.preset?.dayOfWeek ?? "x"}:${editor.preset?.startTime ?? "x"}`}
          open
          mode={editor.kind === "edit" ? "edit" : "create"}
          initial={editor.kind === "edit" ? editor.block : (editor.preset ?? undefined)}
          courses={courses.data.courses}
          onSubmit={handleSubmit}
          onDelete={editor.kind === "edit" ? handleDelete : undefined}
          onClose={() => setEditor({ kind: "closed" })}
        />
      )}
    </>
  );
}
