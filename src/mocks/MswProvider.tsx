"use client";

import { useEffect, useState } from "react";

// 본 과제는 백엔드가 없어 dev에서 항상 MSW를 켠다.
const ENABLE_MSW = process.env.NODE_ENV === "development";

export function MswProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!ENABLE_MSW);

  useEffect(() => {
    if (!ENABLE_MSW) return;
    let cancelled = false;
    (async () => {
      const { worker } = await import("./browser");
      await worker.start({ onUnhandledRequest: "bypass" });
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
