"use client";

import { useEffect, useState } from "react";

// 본 과제는 백엔드가 없어 production 빌드에서도 MSW로 mock한다.
// worker가 준비된 뒤에 children을 렌더해야 첫 fetch가 404로 떨어지지 않는다.

export function MswProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { worker } = await import("./browser");
        await worker.start({
          onUnhandledRequest: "bypass",
          serviceWorker: { url: "/mockServiceWorker.js" },
        });
      } catch (e) {
        console.error("[MswProvider] worker failed to start", e);
      } finally {
        // worker 실패해도 빈 화면에 갇히지 않도록 finally에서 setReady
        setReady(true);
      }
    })();
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
