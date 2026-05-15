"use client";

import { useEffect } from "react";

// 본 과제는 백엔드가 없어 dev에서 항상 MSW를 켠다.
// children은 즉시 렌더 — 헤더/스켈레톤이 사라졌다 나타나는 깜빡임 방지.
// worker 시작 전 잠깐 발생하는 fetch는 query의 retry로 흡수된다.
const ENABLE_MSW = process.env.NODE_ENV === "development";

export function MswProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!ENABLE_MSW) return;
    (async () => {
      const { worker } = await import("./browser");
      await worker.start({ onUnhandledRequest: "bypass" });
    })();
  }, []);

  return <>{children}</>;
}
