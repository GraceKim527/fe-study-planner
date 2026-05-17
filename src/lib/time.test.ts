import { describe, it, expect } from "vitest";
import {
  timeToMinutes,
  minutesToTime,
  generateTimeSlots,
  toDayOfWeek,
  getWeekStart,
  formatDateKey,
  formatTimeRange,
  formatDuration,
  formatWeekRange,
  parseDateKey,
  addWeeks,
} from "./time";

describe("timeToMinutes", () => {
  it("정시를 분으로 변환", () => {
    expect(timeToMinutes("09:00")).toBe(540);
  });

  it("30분 단위 변환", () => {
    expect(timeToMinutes("09:30")).toBe(570);
  });

  it("자정은 0", () => {
    expect(timeToMinutes("00:00")).toBe(0);
  });

  it("23:59는 1439", () => {
    expect(timeToMinutes("23:59")).toBe(23 * 60 + 59);
  });

  it("HH:mm 형식이 아니면 NaN", () => {
    expect(timeToMinutes("9:00")).toBeNaN();
    expect(timeToMinutes("24:00")).toBeNaN();
    expect(timeToMinutes("09:60")).toBeNaN();
    expect(timeToMinutes("invalid")).toBeNaN();
  });
});

describe("minutesToTime", () => {
  it("0은 00:00", () => {
    expect(minutesToTime(0)).toBe("00:00");
  });

  it("570은 09:30", () => {
    expect(minutesToTime(570)).toBe("09:30");
  });

  it("범위 밖은 빈 문자열", () => {
    expect(minutesToTime(-1)).toBe("");
    expect(minutesToTime(24 * 60)).toBe("");
    expect(minutesToTime(NaN)).toBe("");
  });

  it("timeToMinutes의 역연산", () => {
    expect(minutesToTime(timeToMinutes("13:45"))).toBe("13:45");
  });
});

describe("generateTimeSlots", () => {
  it("08:00~20:00 60분 단위는 13개 (양 끝 포함)", () => {
    const slots = generateTimeSlots(8, 20, 60);
    expect(slots).toHaveLength(13);
    expect(slots[0]).toBe("08:00");
    expect(slots.at(-1)).toBe("20:00");
  });

  it("08:00~20:00 30분 단위는 25개", () => {
    const slots = generateTimeSlots(8, 20, 30);
    expect(slots).toHaveLength(25);
    expect(slots[1]).toBe("08:30");
  });
});

describe("toDayOfWeek", () => {
  it("월요일은 0", () => {
    // 2026-05-11은 월요일
    expect(toDayOfWeek(new Date(2026, 4, 11))).toBe(0);
  });

  it("일요일은 6", () => {
    // 2026-05-17은 일요일
    expect(toDayOfWeek(new Date(2026, 4, 17))).toBe(6);
  });
});

describe("getWeekStart", () => {
  it("수요일을 입력하면 같은 주 월요일을 반환", () => {
    // 2026-05-13(수) → 2026-05-11(월)
    const monday = getWeekStart(new Date(2026, 4, 13, 15, 30));
    expect(monday.getFullYear()).toBe(2026);
    expect(monday.getMonth()).toBe(4);
    expect(monday.getDate()).toBe(11);
    expect(monday.getHours()).toBe(0);
    expect(monday.getMinutes()).toBe(0);
  });

  it("월요일을 입력하면 자기 자신", () => {
    const monday = getWeekStart(new Date(2026, 4, 11, 9, 0));
    expect(monday.getDate()).toBe(11);
  });

  it("일요일을 입력하면 6일 전 월요일", () => {
    // 2026-05-17(일) → 2026-05-11(월)
    const monday = getWeekStart(new Date(2026, 4, 17));
    expect(monday.getDate()).toBe(11);
  });
});

describe("formatDateKey", () => {
  it("YYYY-MM-DD 포맷 (zero-pad)", () => {
    expect(formatDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("formatTimeRange", () => {
  it("시작 - 끝 형식", () => {
    expect(formatTimeRange("09:00", "10:30")).toBe("09:00 - 10:30");
  });
});

describe("formatDuration", () => {
  it("0 이하는 0분", () => {
    expect(formatDuration(0)).toBe("0분");
    expect(formatDuration(-10)).toBe("0분");
  });

  it("60분 미만은 분만", () => {
    expect(formatDuration(45)).toBe("45분");
  });

  it("정시는 시간만", () => {
    expect(formatDuration(120)).toBe("2시간");
  });

  it("시간+분", () => {
    expect(formatDuration(90)).toBe("1시간 30분");
  });
});

describe("parseDateKey", () => {
  it("YYYY-MM-DD를 로컬 타임존 Date로 파싱한다", () => {
    const date = parseDateKey("2026-05-11");
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2026);
    expect(date!.getMonth()).toBe(4);
    expect(date!.getDate()).toBe(11);
    expect(date!.getHours()).toBe(0);
  });

  it("잘못된 형식이면 null", () => {
    expect(parseDateKey("2026/05/11")).toBeNull();
    expect(parseDateKey("2026-5-11")).toBeNull();
    expect(parseDateKey("")).toBeNull();
    expect(parseDateKey("invalid")).toBeNull();
  });

  it("존재하지 않는 날짜는 null (2월 30일 등)", () => {
    expect(parseDateKey("2026-02-30")).toBeNull();
    expect(parseDateKey("2026-13-01")).toBeNull();
  });

  it("formatDateKey의 역연산", () => {
    const date = new Date(2026, 4, 11);
    expect(formatDateKey(parseDateKey(formatDateKey(date))!)).toBe("2026-05-11");
  });
});

describe("addWeeks", () => {
  it("+1주는 7일 후 같은 요일", () => {
    const monday = new Date(2026, 4, 11);
    const next = addWeeks(monday, 1);
    expect(formatDateKey(next)).toBe("2026-05-18");
  });

  it("-1주는 7일 전", () => {
    const monday = new Date(2026, 4, 11);
    const prev = addWeeks(monday, -1);
    expect(formatDateKey(prev)).toBe("2026-05-04");
  });

  it("월 경계 넘기기", () => {
    const monday = new Date(2026, 4, 25);
    const next = addWeeks(monday, 1);
    expect(formatDateKey(next)).toBe("2026-06-01");
  });

  it("0은 그대로", () => {
    const monday = new Date(2026, 4, 11);
    expect(formatDateKey(addWeeks(monday, 0))).toBe("2026-05-11");
  });
});

describe("formatWeekRange", () => {
  it("월요일부터 일요일까지 6일 차이로 포맷한다", () => {
    const monday = new Date(2026, 4, 11);
    expect(formatWeekRange(monday)).toBe("5월 11일(월) – 5월 17일(일)");
  });

  it("월말을 넘어가는 주도 정상 처리한다", () => {
    const monday = new Date(2026, 4, 25);
    expect(formatWeekRange(monday)).toBe("5월 25일(월) – 5월 31일(일)");
  });
});
