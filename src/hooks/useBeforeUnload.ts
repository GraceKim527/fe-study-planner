import { useEffect } from "react";

// when=true일 때만 브라우저 기본 이탈 확인 다이얼로그를 띄운다.
// 커스텀 메시지는 Chrome/Firefox 모두 무시하므로 returnValue만 세팅.
export function useBeforeUnload(when: boolean): void {
  useEffect(() => {
    if (!when) return;

    function handler(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [when]);
}
