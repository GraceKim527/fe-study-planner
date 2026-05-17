"use client";

import type { RefObject } from "react";
import type { TimeString } from "@/types";
import styles from "./TimePicker.module.css";

// HH select × MM select 두 개로 30분 단위 + startHour~endHour 범위 강제.
// 값은 부모 form과 같은 "HH:MM" 문자열. 종료 + HH=endHour일 땐 MM 30 disabled.
interface Props {
  role: "start" | "end";
  value: TimeString;
  onChange(next: TimeString): void;
  startHour: number;
  endHour: number;
  groupId: string;
  invalid?: boolean;
  describedBy?: string;
  hourRef?: RefObject<HTMLSelectElement | null>;
}

export function TimePicker({
  role,
  value,
  onChange,
  startHour,
  endHour,
  groupId,
  invalid,
  describedBy,
  hourRef,
}: Props) {
  const [hh, mm] = value ? value.split(":") : ["", ""];
  // 시작은 endHour 미포함(시작=20:00은 길이 0), 종료는 endHour 포함.
  const hourMax = role === "end" ? endHour : endHour - 1;
  const hourOptions: number[] = [];
  for (let h = startHour; h <= hourMax; h++) hourOptions.push(h);
  const disableHalf = role === "end" && Number(hh) === endHour;

  function setHour(next: string) {
    if (next === "") {
      onChange("");
      return;
    }
    // HH만 정해진 단계에선 MM이 비어있을 수 있다. 기본 00으로 채워 유효한 HH:MM 유지.
    const nextMm = mm === "" || (next === String(endHour).padStart(2, "0") && mm === "30") ? "00" : mm;
    onChange(`${next}:${nextMm}`);
  }

  function setMinute(next: string) {
    if (hh === "") return;
    onChange(`${hh}:${next}`);
  }

  return (
    <div className={styles.timeGroup} role="group" aria-labelledby={groupId}>
      <select
        ref={hourRef}
        className={styles.select}
        value={hh}
        onChange={(e) => setHour(e.target.value)}
        aria-label={role === "start" ? "시작 시" : "종료 시"}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        required
      >
        <option value="" disabled>시</option>
        {hourOptions.map((h) => {
          const v = String(h).padStart(2, "0");
          return (
            <option key={v} value={v}>{v}</option>
          );
        })}
      </select>
      <span className={styles.sep} aria-hidden>:</span>
      <select
        className={styles.select}
        value={mm}
        onChange={(e) => setMinute(e.target.value)}
        aria-label={role === "start" ? "시작 분" : "종료 분"}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={hh === ""}
        required
      >
        <option value="" disabled>분</option>
        <option value="00">00</option>
        <option value="30" disabled={disableHalf}>30</option>
      </select>
    </div>
  );
}
